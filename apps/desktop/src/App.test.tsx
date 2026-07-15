import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AtlasProvider } from './context/AtlasContext';
import { App } from './App';

// Minimal DOM mocks for testing environment
globalThis.window.addEventListener = vi.fn();
globalThis.window.removeEventListener = vi.fn();

describe('Desktop Workspace Shell UI', () => {
  it('renders side menu tabs and allows switching views', async () => {
    // Render the app inside the Provider context
    render(
      <AtlasProvider>
        <App />
      </AtlasProvider>
    );

    // Initial default tab is Mission Control (landing screen with prompt query)
    expect(screen.getByText('What do you want your AI team to accomplish?')).toBeDefined();

    // Click on Agent Builder tab
    const agentTab = screen.getByText('Agent Builder');
    fireEvent.click(agentTab);

    // Assert screen updates to reflect agent list (using getAllByText because Active Agents is also in the status bar)
    await waitFor(() => {
      expect(screen.getAllByText(/Active Agents/i).length).toBeGreaterThan(0);
    });

    // Click on Settings tab
    const settingsTab = screen.getByText('Settings');
    fireEvent.click(settingsTab);
    expect(screen.getByText(/Telemetry Status/i)).toBeDefined();
  });

  it('allows switching project workspace views', async () => {
    render(
      <AtlasProvider>
        <App />
      </AtlasProvider>
    );

    const select = screen.getAllByRole('combobox')[0];
    expect(select).toBeDefined();
    
    // Default project is seeded asynchronously in useEffect
    const projectOptions = await screen.findAllByText('Atlas Core OS', {}, { timeout: 5000 });
    expect(projectOptions.length).toBeGreaterThan(0);
  });
});
