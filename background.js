// Function to create the context menu
function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "saveNote",
      title: "Add to noteD",
      contexts: ["selection"]
    });
  });
}

// Create the context menu when the service worker starts
createContextMenu();

// Listen for clicks on the context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveNote") {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => window.getSelection().toString()
      },
      (injectionResults) => {
        if (
          injectionResults &&
          injectionResults[0] &&
          injectionResults[0].result
        ) {
          let selectedText = injectionResults[0].result;
          let createdAt = new Date().toISOString();
          chrome.storage.sync.get({ notes: [] }, (result) => {
            let notes = result.notes;
            notes.push({
              title: "",
              note: selectedText,
              url: tab.url,
              dueDate: "",
              completed: false,
              createdAt: createdAt
            });
            chrome.storage.sync.set({ notes: notes });
          });
        }
      }
    );
  }
});
