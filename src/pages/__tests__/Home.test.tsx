// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { setupIonicReact } from '@ionic/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Home from '../Home';

setupIonicReact();

const STORAGE_KEY = 'reminders:v1';

/** Ionic inputs emit `ionInput` custom events rather than React `onChange`. */
function ionInput(el: Element, value: string) {
  act(() => {
    el.dispatchEvent(new CustomEvent('ionInput', { detail: { value }, bubbles: true }));
  });
}

describe('Home page', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('shows reminders restored from localStorage', () => {
    const due = Date.now() + 86_400_000 * 3;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'a', title: 'Water the plants', due, repeat: 'weekly', done: false }]),
    );
    render(<Home />);
    expect(screen.getByText('Water the plants')).toBeTruthy();
    expect(screen.getByText(/repeats weekly/)).toBeTruthy();
  });

  it('adds a reminder and persists it', () => {
    const { container } = render(<Home />);
    const [titleInput] = container.querySelectorAll('ion-input');
    ionInput(titleInput, 'Pay the electricity bill');
    fireEvent.click(screen.getByText('Add reminder'));
    expect(screen.getByText('Pay the electricity bill')).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('Pay the electricity bill');
  });

  it('shows a validation error for an empty title', () => {
    render(<Home />);
    fireEvent.click(screen.getByText('Add reminder'));
    expect(screen.getByRole('alert').textContent).not.toBe('');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]');
  });

  it('deletes a reminder', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'a', title: 'Call mum', due: Date.now() + 3_600_000, repeat: 'none', done: false }]),
    );
    render(<Home />);
    fireEvent.click(screen.getByLabelText('Delete Call mum'));
    expect(screen.queryByText('Call mum')).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([]);
  });
});
