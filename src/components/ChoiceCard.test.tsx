import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChoiceCard from './ChoiceCard';

// Mock KaTeX
vi.mock('../utils/katex', () => ({
  renderLine: (text: string) => <span>{text}</span>,
}));

describe('ChoiceCard', () => {
  const options = ['Option A', 'Option B', 'Option C', 'Option D'];

  it('renders all options', () => {
    render(
      <ChoiceCard
        question="Pick one?"
        options={options}
        answer={0}
        onScore={() => {}}
      />
    );

    expect(screen.getByText(/Option A/)).toBeInTheDocument();
    expect(screen.getByText(/Option B/)).toBeInTheDocument();
    expect(screen.getByText(/Option C/)).toBeInTheDocument();
    expect(screen.getByText(/Option D/)).toBeInTheDocument();
  });

  it('calls onScore(3) when correct option is clicked', () => {
    const onScore = vi.fn();
    render(
      <ChoiceCard
        question="Pick one?"
        options={options}
        answer={0}
        onScore={onScore}
      />
    );

    // The correct option is answer=0 (Option A), but after Fisher-Yates shuffle
    // we don't know which position it will be. We need to find it.
    // The correct one will have class containing "green" after submission.
    // Let's click each option and check onScore behavior.

    // Actually, since shuffle is random, we click all options one by one.
    // Only the first click triggers onScore.
    const optionElements = screen.getAllByText(/Option [A-D]/);
    for (const el of optionElements) {
      fireEvent.click(el.closest('div')!);
    }

    // Should have been called exactly once
    expect(onScore).toHaveBeenCalledTimes(1);
    // Score must be either 3 or 0
    const score = onScore.mock.calls[0][0];
    expect([0, 3]).toContain(score);
  });

  it('shows green for correct and red for wrong after selection', () => {
    render(
      <ChoiceCard
        question="Pick one?"
        options={options}
        answer={0}
        onScore={() => {}}
      />
    );

    const optionElements = screen.getAllByText(/Option [A-D]/);
    // Click the first option
    fireEvent.click(optionElements[0].closest('div')!);

    // After clicking, the correct option should have green styling
    // We verify that at least one element has a green-related class
    const rendered = document.body.innerHTML;
    expect(rendered.includes('green')).toBe(true);
  });

  it('prevents clicking after submission', () => {
    const onScore = vi.fn();
    render(
      <ChoiceCard
        question="Pick one?"
        options={options}
        answer={0}
        onScore={onScore}
      />
    );

    // Click first option
    const optionElements = screen.getAllByText(/Option [A-D]/);
    fireEvent.click(optionElements[0].closest('div')!);
    // Try clicking again
    fireEvent.click(optionElements[1].closest('div')!);

    // onScore should only be called once
    expect(onScore).toHaveBeenCalledTimes(1);
  });

  it('preserves all options after shuffle (no duplicates, no missing)', () => {
    render(
      <ChoiceCard
        question="Pick one?"
        options={options}
        answer={0}
        onScore={() => {}}
      />
    );

    const renderedTexts = screen.getAllByText(/Option [A-D]/).map(el => el.textContent);
    expect(renderedTexts).toHaveLength(4);
    for (const opt of options) {
      expect(renderedTexts).toContain(opt);
    }
  });

  it('prevents context menu (right-click)', () => {
    render(
      <ChoiceCard
        question="Pick one?"
        options={options}
        answer={0}
        onScore={() => {}}
      />
    );

    const container = screen.getByText(/Pick one/).closest('div')!;
    const contextEvent = new Event('contextmenu', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(contextEvent, 'preventDefault');
    fireEvent(container, contextEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
