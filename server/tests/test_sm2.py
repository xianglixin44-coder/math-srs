"""SM-2 algorithm tests — highest priority, pure function, 100% branch coverage."""

import json
from datetime import datetime, timedelta

import pytest
from server.database import sm2_update, get_due_cards, with_db


def _insert_card(conn, card_id="99-99", title="Test Card"):
    conn.execute(
        "INSERT OR IGNORE INTO cards VALUES (?,?,?,?,?,?,?)",
        (card_id, title, "Test", "[]",
         json.dumps({"cloze": {"formula": {"question": "x=[[1]]", "answer": ["1"]}}}),
         "test", 1)
    )
    conn.commit()


class TestSm2FirstReview:
    """First review of a new card (reps=0)."""

    def test_correct_first_review_sets_interval_1(self, seed_card):
        result = sm2_update(seed_card["id"], 3)
        assert result["interval"] == 1
        assert result["reps"] == 1
        assert result["ease_factor"] == 2.6  # 2.5 + 0.1
        due = datetime.fromisoformat(result["due_date"])
        assert due.date() == (datetime.now() + timedelta(days=1)).date()

    def test_wrong_first_review_resets_interval(self, seed_card):
        result = sm2_update(seed_card["id"], 0)
        assert result["interval"] == 1
        assert result["reps"] == 0  # reps reset
        assert result["ease_factor"] == 2.3  # 2.5 - 0.2


class TestSm2SecondReview:
    """Second review (reps=1)."""

    def test_correct_second_review_sets_interval_6(self, seed_card):
        sm2_update(seed_card["id"], 3)  # first
        result = sm2_update(seed_card["id"], 3)  # second
        assert result["interval"] == 6
        assert result["reps"] == 2
        assert result["ease_factor"] == 2.7  # 2.6 + 0.1
        due = datetime.fromisoformat(result["due_date"])
        assert due.date() == (datetime.now() + timedelta(days=6)).date()

    def test_wrong_second_review_resets_to_1(self, seed_card):
        sm2_update(seed_card["id"], 3)  # first (reps=1, interval=1)
        result = sm2_update(seed_card["id"], 0)  # wrong
        assert result["interval"] == 1
        assert result["reps"] == 0  # reps reset to 0
        assert result["ease_factor"] == 2.4  # 2.5 - 0.2 + 0.1 = 2.4... 
        # Actually: after first correct: ef=2.6. After wrong: ef=2.6-0.2=2.4


class TestSm2SubsequentReviews:
    """Third+ reviews with interval * ef."""

    def test_third_correct_multiplies_interval(self, seed_card):
        sm2_update(seed_card["id"], 3)  # reps=1, interval=1
        sm2_update(seed_card["id"], 3)  # reps=2, interval=6
        result = sm2_update(seed_card["id"], 3)  # reps=3, interval = max(1, int(6*2.7)) = max(1, 16) = 16
        assert result["interval"] == 16  # 6 * 2.7 = 16.2 → int=16
        assert result["reps"] == 3
        assert result["ease_factor"] == pytest.approx(2.8)

    def test_wrong_after_multiple_correct(self, seed_card):
        sm2_update(seed_card["id"], 3)
        sm2_update(seed_card["id"], 3)
        result = sm2_update(seed_card["id"], 0)  # wrong on third
        assert result["interval"] == 1
        assert result["reps"] == 0
        assert result["ease_factor"] == 2.5  # 2.7 - 0.2 = 2.5


class TestSm2EFFloor:
    """Ease factor should never drop below 1.3."""

    def test_ef_floor_not_broken(self, seed_card):
        # Simulate many wrong answers
        ef = 2.5
        for i in range(10):
            result = sm2_update(seed_card["id"], 0)
            ef = max(1.3, ef - 0.2)
        assert result["ease_factor"] == pytest.approx(1.3)
        assert result["interval"] == 1

    def test_ef_hit_floor_and_then_correct(self, seed_card):
        # Push ef to floor
        for _ in range(8):
            sm2_update(seed_card["id"], 0)
        result = sm2_update(seed_card["id"], 3)
        assert result["ease_factor"] == pytest.approx(1.4)  # 1.3 + 0.1
        assert result["interval"] == 1  # reps=0 → first=1


class TestSm2EdgeCases:
    """Invalid inputs and boundaries."""

    def test_invalid_card_id_raises(self):
        with pytest.raises(ValueError, match="Card not found"):
            sm2_update("nonexistent", 3)

    def test_invalid_score_raises(self, seed_card):
        with pytest.raises(ValueError, match="Score must be 0 or 3"):
            sm2_update(seed_card["id"], 1)
        with pytest.raises(ValueError, match="Score must be 0 or 3"):
            sm2_update(seed_card["id"], 2)

    def test_multiple_cards_independent(self):
        """Two cards' SRS states should not interfere."""
        with with_db() as conn:
            _insert_card(conn, "card-a", "Card A")
            _insert_card(conn, "card-b", "Card B")
        r1 = sm2_update("card-a", 3)
        r2 = sm2_update("card-b", 0)
        assert r1["ease_factor"] == 2.6
        assert r2["ease_factor"] == 2.3


class TestSm2DueCards:
    """get_due_cards filtering logic."""

    def test_new_card_is_due(self, seed_card):
        due = get_due_cards()
        ids = [c["id"] for c in due]
        assert seed_card["id"] in ids

    def test_just_reviewed_card_not_due(self, seed_card):
        sm2_update(seed_card["id"], 3)
        due = get_due_cards()
        # After correct review, due_date = tomorrow, so it shouldn't be due
        ids = [c["id"] for c in due]
        assert seed_card["id"] not in ids

    def test_past_due_card_is_due(self, seed_card):
        # Manually set due_date to yesterday
        yesterday = (datetime.now() - timedelta(days=1)).isoformat()
        with with_db() as conn:
            conn.execute(
                "INSERT INTO srs_state (card_id, ease_factor, interval, due_date, reps, last_review) "
                "VALUES (?, 2.5, 1, ?, 0, ?)",
                (seed_card["id"], yesterday, yesterday))
            conn.commit()
        due = get_due_cards()
        ids = [c["id"] for c in due]
        assert seed_card["id"] in ids

    def test_disabled_card_not_returned(self, seed_card):
        with with_db() as conn:
            conn.execute("UPDATE cards SET enabled=0 WHERE id=?", (seed_card["id"],))
            conn.commit()
        due = get_due_cards()
        ids = [c["id"] for c in due]
        assert seed_card["id"] not in ids
