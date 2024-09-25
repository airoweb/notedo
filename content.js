chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getnoteData") {
    let selectionText = window.getSelection().toString();
    if (selectionText) {
      let title = prompt("Enter title (optional):", "");
      let dueDate = prompt("Enter due date (optional):", "");
      sendResponse({ selectionText: selectionText, title: title, dueDate: dueDate });
    } else {
      sendResponse({ selectionText: null });
    }
  }
});
