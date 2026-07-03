import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClozeCard from './ClozeCard';

// Mock KaTeX — it's not needed for logic tests
vi.mock('../utils/katex', () => ({
  renderLine: (text: string) => <span>{text}</span>,
}));

describe('ClozeCard', () => {
  const defaultQuestion = 'x = [[1]]，y = [[2]]';
  const defaultAnswer = ['1', '2'];

  it('renders input fields for each blank', () => {
    render(<ClozeCard question={defaultQuestion} answer={defaultAnswer} onScore={() => {}} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(2);
  });

  it('calls onScore(3) when all answers are correct', async () => {
    const onScore = vi.fn();
    render(<ClozeCard question={defaultQuestion} answer={defaultAnswer} onScore={onScore} />);

    const inputs = screen.getAllByRole('textbox');
    await userEvent.type(inputs[0], '1');
    await userEvent.type(inputs[1], '2');

    fireEvent.click(screen.getByText('提交'));
    expect(onScore).toHaveBeenCalledWith(3);
  });

  it('calls onScore(0) when any answer is wrong', async () => {
    const onScore = vi.fn();
    render(<ClozeCard question={defaultQuestion} answer={defaultAnswer} onScore={onScore} />);

    const inputs = screen.getAllByRole('textbox');
    await userEvent.type(inputs[0], '1');
    await userEvent.type(inputs[1], 'wrong');

    fireEvent.click(screen.getByText('提交'));
    expect(onScore).toHaveBeenCalledWith(0);
  });

  it('normalizes full-width and half-width characters', async () => {
    const onScore = vi.fn();
    // Use answers with full-width equivalents
    render(<ClozeCard question={'x = [[1]]'} answer={['A']} onScore={onScore} />);

    const input = screen.getByRole('textbox');
    // Full-width latin capital A (U+FF21)
    await userEvent.type(input, 'Ａ');

    fireEvent.click(screen.getByText('提交'));
    expect(onScore).toHaveBeenCalledWith(3);
  });

  it('shows correct answer when wrong', async () => {
    render(<ClozeCard question={'x = [[1]]'} answer={['42']} onScore={() => {}} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'wrong');
    fireEvent.click(screen.getByText('提交'));

    expect(screen.getByText(/正确答案.*42/)).toBeInTheDocument();
  });

  it('prevents paste event', () => {
    render(<ClozeCard question={'x = [[1]]'} answer={['1']} onScore={() => {}} />);
    const input = screen.getByRole('textbox');

    const pasteEvent = new Event('paste', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(pasteEvent, 'preventDefault');
    fireEvent(input, pasteEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('prevents copy event', () => {
    render(<ClozeCard question={'x = [[1]]'} answer={['1']} onScore={() => {}} />);
    const input = screen.getByRole('textbox');

    const copyEvent = new Event('copy', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(copyEvent, 'preventDefault');
    fireEvent(input, copyEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('prevents copy event', () => {
    render(<ClozeCard question={'x = [[1]]'} answer={['1']} onScore={() => {}} />);
    const input = screen.getByRole('textbox');

    const copyEvent = new Event('copy', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(copyEvent, 'preventDefault');
    fireEvent(input, copyEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('prevents context menu (right-click)', () => {
    render(<ClozeCard question={'x = [[1]]'} answer={['1']} onScore={() => {}} />);
    const container = screen.getByText(/x =/).closest('div')!;

    const contextEvent = new Event('contextmenu', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(contextEvent, 'preventDefault');
    fireEvent(container, contextEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('disables submit button after submission', async () => {
    render(<ClozeCard question={'x = [[1]]'} answer={['1']} onScore={() => {}} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, '1');
    fireEvent.click(screen.getByText('提交'));

    expect(screen.queryByText('提交')).not.toBeInTheDocument();
  });
});
