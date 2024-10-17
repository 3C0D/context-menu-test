import {
  Plugin,
  TFolder
} from "obsidian";
import { around } from "monkey-around";
import {  InternalPluginName, type FileExplorerView, type InternalPlugin } from "obsidian-typings";


export default class FolderContextMenu extends Plugin {
  fileExplorerView: FileExplorerView;
  fileExplorerPlugin: InternalPlugin;

  onload(): void {
    this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
  }

  async onLayoutReady(): Promise<void> {
    const fileExplorerPluginInstance = this.app.internalPlugins.getEnabledPluginById(InternalPluginName.FileExplorer);
    console.log("fileExplorerPluginInstance", fileExplorerPluginInstance)

    if (!fileExplorerPluginInstance) {
      return;
    }

    this.fileExplorerView = this.app.workspace.getLeavesOfType('file-explorer')[0].view;

    this.register(openFileContextMenuWrapper(this));

    this.addVaultSwitcherContextMenu();

  }

  private addVaultSwitcherContextMenu() {
    const vaultSwitcherEl = document.querySelector('.workspace-drawer-vault-switcher') as HTMLElement;
    if (vaultSwitcherEl) {
      this.fileExplorerView.files.set(vaultSwitcherEl, this.app.vault.getRoot());
      this.registerDomEvent(vaultSwitcherEl, 'contextmenu', (event: MouseEvent) => {
        event.preventDefault();
        this.fileExplorerView.openFileContextMenu(event, vaultSwitcherEl.childNodes[0] as HTMLElement);
      });
    }
  }
}


function openFileContextMenuWrapper(plugin: FolderContextMenu) {
  const viewPrototype = Object.getPrototypeOf(plugin.fileExplorerView);
  return around(viewPrototype, {
    openFileContextMenu(old:any) {
      return function (...args: [event: Event, fileItemEl: HTMLElement]): void {
        const file = this.files.get(args[1].parentElement);
        if (!file) return
        if (!file.isRoot() || !(file instanceof TFolder)) {
          old.apply(args);
          return;
        }
        const originalIsRoot = file.isRoot;
        file.isRoot = () => false;
        old.apply(args);
        file.isRoot = originalIsRoot;
      }
    }
  })
}