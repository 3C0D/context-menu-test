import { around } from 'monkey-around';
import {
  Plugin,
  TFolder
} from 'obsidian';
import type { FileExplorerView } from "obsidian-typings";
import { InternalPluginName } from 'obsidian-typings/implementations';

type OpenFileCM = FileExplorerView['openFileContextMenu']
type OpenFileCMArgs = Parameters<OpenFileCM>

export default class RootFolderContextMenu extends Plugin {
  fileExplorerView!: FileExplorerView;

  public override onload(): void {
    this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
  }

  onLayoutReady(): void {
    this.fileExplorerView = this.app.workspace.getLeavesOfType(InternalPluginName.FileExplorer)[0].view;

    this.register(this.openFileContextMenuWrapper(this));

    const vaultSwitcherEl = document.querySelector<HTMLElement>('.workspace-drawer-vault-switcher');
    if (vaultSwitcherEl) {
      this.fileExplorerView.files.set(vaultSwitcherEl, this.app.vault.getRoot());
      this.registerDomEvent(vaultSwitcherEl, 'contextmenu', async (ev: MouseEvent): Promise<void> => {
        this.fileExplorerView.openFileContextMenu(ev, vaultSwitcherEl.childNodes[0] as HTMLElement);
        document.body.click();
      });
    }
  }

  private openFileContextMenuWrapper(plugin: RootFolderContextMenu) {
    return around(Object.getPrototypeOf(plugin.fileExplorerView), {
      openFileContextMenu(old: OpenFileCM): OpenFileCM {
        return function (...args: OpenFileCMArgs): void {
          if (!plugin.fileExplorerView) return old.apply(this, args)
          const file = this.files?.get(args[1]?.parentElement);
          if (!file || !(file instanceof TFolder)) {
            return old.apply(this, args);
          }
          // Temporarily override isRoot
          const originalIsRoot = file.isRoot;
          file.isRoot = () => false;
          old.apply(this, args);
          file.isRoot = originalIsRoot;
        }
      }
    })
  }
}
