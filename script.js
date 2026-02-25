const add_new_button = document.getElementById("add_new_button");
const linksDiv = document.querySelector(".links-area");

const showToast = (message, type = "success") => {
  const existingToast = document.querySelector(".toast-msg");
  if (existingToast) existingToast.remove();

  const toast = document.createElement("div");
  toast.className = `toast-msg fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md shadow-lg text-white text-sm font-medium transition-opacity duration-300 z-50 ${
    type === "success" ? "bg-green-600" : "bg-blue-600"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
};

const saveToStorage = (key, linkData, silent = false) => {
  if (!key) return;
  chrome.storage.local.get(key, (items) => {
    const oldValue = items[key] || "";
    const newValue = linkData.trim();

    chrome.storage.local.set({ [key]: newValue }, () => {
      if (silent) return;
      if (newValue === "" && oldValue === "") {
        showToast("Nothing to save! ℹ️", "info");
      } else if (newValue === "" && oldValue !== "") {
        showToast(`${key} Cleared 🧹`, "info");
      } else {
        showToast(`${key} Saved! ✔️`);
      }
    });
  });
};

const copyToClipboard = async (urlData) => {
  if (!urlData || urlData.trim() === "") {
    showToast("Nothing to copy!", "info");
    return;
  }
  try {
    await navigator.clipboard.writeText(urlData);
    showToast("Link Copied! 📋");
  } catch (error) {
    console.error("Clipboard error:", error);
  }
};

const loadAllFromStorage = () => {
  const defaultFields = ["Github", "Linkedin", "Twitter", "Portfolio", "Email", "Dev"];
  chrome.storage.local.get(null, (items) => {
    let customFields = items.customFields || defaultFields;
    if (!items.customFields) {
      chrome.storage.local.set({ customFields: defaultFields });
    }
    customFields.forEach((field) => {
      renderFields({ newFieldName: field, isNewField: false, storedValue: items[field] || "" });
    });
  });
};

const renderFields = ({ newFieldName, isNewField, storedValue = "" }) => {
  const newField = document.createElement("div");
  newField.className = "flex flex-row justify-center items-center ml-3 mb-3";

  const iconsHash = {
    Linkedin: "fab fa-linkedin",
    Github: "fab fa-github-alt",
    Twitter: "fab fa-twitter",
    Portfolio: "fab fa-instagram",
    Email: "fas fa-envelope",
    Dev: "fab fa-dev",
  };

  const newIcon = document.createElement("i");
  newIcon.style.fontSize = "28px";
  newIcon.classList.add(...(iconsHash[newFieldName] ? iconsHash[newFieldName].split(" ") : ["fas", "fa-link"]));

  const newFieldInput = document.createElement("input");
  newFieldInput.className = "w-3/5 ml-4 px-2 py-2 shadow-md rounded-md text-left focus:ring-2 focus:ring-blue-400 outline-none";
  newFieldInput.setAttribute("placeholder", newFieldName);
  newFieldInput.id = newFieldName;
  newFieldInput.value = storedValue;

  const newFieldSaveBtn = createButton("fas fa-save", () => saveToStorage(newFieldName, newFieldInput.value));
  const newFieldCopyBtn = createButton("fas fa-copy", () => copyToClipboard(newFieldInput.value));
  const newFieldLinkBtn = createButton("fas fa-external-link-alt", () => {
    if (newFieldInput.value.trim() !== "") window.open(newFieldInput.value, '_blank');
    else showToast("No link to open!", "info");
  });

  const newFieldDeleteBtn = createButton("fas fa-trash", () => {
    const defaultFields = ["Github", "Linkedin", "Twitter", "Portfolio", "Email", "Dev"];
    
    if (newFieldInput.value.trim() !== "") {
      newFieldInput.value = "";
      saveToStorage(newFieldName, "", true); 
      showToast(`${newFieldName} text cleared`, "info");
    } 
    else {
      if (defaultFields.includes(newFieldName)) {
        showToast("Default profiles cannot be removed", "info");
      } else {
        if (confirm(`Delete the '${newFieldName}' profile entirely?`)) {
          chrome.storage.local.get("customFields", (data) => {
            let fields = data.customFields || [];
            const updatedFields = fields.filter(f => f !== newFieldName);
            chrome.storage.local.remove(newFieldName);
            chrome.storage.local.set({ customFields: updatedFields }, () => {
              newField.remove();
              showToast(`${newFieldName} removed entirely`);
            });
          });
        }
      }
    }
  });

  newField.append(newIcon, newFieldInput, newFieldSaveBtn, newFieldCopyBtn, newFieldLinkBtn, newFieldDeleteBtn);
  linksDiv.appendChild(newField);

  if (isNewField) {
    chrome.storage.local.get("customFields", (data) => {
      let fields = data.customFields || [];
      if (!fields.includes(newFieldName)) {
        fields.push(newFieldName);
        chrome.storage.local.set({ customFields: fields });
      }
    });
  }
};

function createButton(iconClass, onClick) {
  const btn = document.createElement("button");
  btn.className = "m-1 bg-white hover:bg-gray-100 text-black py-2 px-3 rounded-md shadow-md transition-all duration-150 cursor-pointer ease-out";
  const icon = document.createElement("i");
  icon.className = iconClass;
  btn.appendChild(icon);
  btn.addEventListener("click", (e) => {
    onClick(e);
    btn.classList.add("scale-110");
    setTimeout(() => btn.classList.remove("scale-110"), 150);
  });
  return btn;
}

add_new_button.addEventListener("click", () => {
  const name = prompt("Enter profile name:");
  if (!name) return;
  chrome.storage.local.get("customFields", (data) => {
    const fields = data.customFields || [];
    if (fields.map(f => f.toLowerCase()).includes(name.toLowerCase())) {
      alert("This name already exists!");
    } else {
      renderFields({ newFieldName: name, isNewField: true });
    }
  });
});

document.addEventListener("DOMContentLoaded", loadAllFromStorage);