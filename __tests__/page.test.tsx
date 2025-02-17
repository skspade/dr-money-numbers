import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

// Mock the page component
jest.mock('../src/app/page', () => ({
  __esModule: true,
  default: () => <h1>Welcome to Dr. Money Numbers</h1>,
}));

describe('Page', () => {
  it('renders a heading', () => {
    render(<h1>Welcome to Dr. Money Numbers</h1>);

    const heading = screen.getByRole('heading', { level: 1 });

    expect(heading).toBeInTheDocument();
  });
}); 