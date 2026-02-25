// [ADD NEW PROFILE] button fetched 
const add_new_button = document.getElementById("add_new_button");

// [DIV WITH PROFILE LINKS] area
const linksDiv = document.querySelector(".links-area");

// Helper to save data to Chrome Storage (MV3 standard)
const saveToStorage = (key, linkData) => {
  if (!key) return;
  chrome.storage.local.set({ [key]: linkData });
};

const copyToClipboard = async (urlData) => {
  if (!urlData) {
    alert("No link to copy ❌ ");
    return;
  }
  try {
    await navigator.clipboard.writeText(urlData);
    alert(urlData + " copied to clipboard ✔ ");
  } catch (error) {
    console.error("Clipboard error:", error);
    alert("Check permissions for clipboard access.");
  }
};

// Initial Load Function
const loadAllFromStorage = () => {
  const defaultFields = ["Github", "Linkedin", "Twitter", "Portfolio", "Email", "Dev"];

  // Fetch all stored data at once
  chrome.storage.local.get(null, (items) => {
    let customFields = items.customFields;

    if (!customFields) {
      // First time setup
      customFields = defaultFields;
      chrome.storage.local.set({ customFields: defaultFields });
    }

    customFields.forEach((field) => {
      // Pass the stored value if it exists
      renderFields({ 
        newFieldName: field, 
        isNewField: false, 
        storedValue: items[field] || "" 
      });
    });
  });
};

const renderFields = ({ newFieldName, isNewField, storedValue = "" }) => {
  const newField = document.createElement("div");
  newField.className = "flex flex-row justify-center items-center ml-3";

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
  if (iconsHash[newFieldName]) {
    newIcon.classList.add(...iconsHash[newFieldName].split(" "));
  } else {
    newIcon.classList.add("fas", "fa-link");
  }

  // Create UI Elements
  const newFieldInput = document.createElement("input");
  newFieldInput.className = "w-3/5 ml-4 px-2 py-2 shadow-md rounded-md text-left";
  newFieldInput.setAttribute("placeholder", newFieldName);
  newFieldInput.id = newFieldName;
  newFieldInput.value = storedValue;

  const newFieldSaveBtn = createButton("fas fa-save", () => {
    saveToStorage(newFieldName, newFieldInput.value);
  });

  const newFieldCopyBtn = createButton("fas fa-copy", () => {
    copyToClipboard(newFieldInput.value);
  });

  const newFieldDeleteBtn = createButton("fas fa-trash", () => {
  const defaultFields = ["Github", "Linkedin", "Twitter", "Portfolio", "Email", "Dev"];

  if (defaultFields.includes(newFieldName)) {
    // SOFT DELETE: Just clear the text for core profiles
    newFieldInput.value = "";
    saveToStorage(newFieldName, "");
    alert(newFieldName + " cleared ✔");
  } else {
    // HARD DELETE: Completely remove custom profile
    if (confirm("Are you sure you want to delete the '" + newFieldName + "' profile?")) {
      chrome.storage.local.get("customFields", (data) => {
        let fields = data.customFields || [];
        // Remove from the names list
        const updatedFields = fields.filter(f => f !== newFieldName);
        
        // Remove the data and update the list
        chrome.storage.local.remove(newFieldName);
        chrome.storage.local.set({ customFields: updatedFields }, () => {
          // Remove the UI element from the screen
          newField.remove();
        });
      });
    }
  }
});

  newField.append(newIcon, newFieldInput, newFieldSaveBtn, newFieldCopyBtn, newFieldDeleteBtn);
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
  
  // Base classes: Added 'transition-transform' and 'duration-150' for a snappy pop
  btn.className = "m-1 bg-white hover:bg-gray-100 text-black py-2 px-4 rounded-md shadow-md transition-transform duration-150 cursor-pointer ease-out";
  
  const icon = document.createElement("i");
  icon.className = iconClass;
  btn.appendChild(icon);

  btn.addEventListener("click", (e) => {
    // 1. Run the action
    onClick(e);

    // 2. ENLARGE: Scale up to 120% instantly
    btn.classList.add("scale-120", "shadow-xl", "z-10");

    // 3. REVERT: Back to normal after 150ms
    setTimeout(() => {
      btn.classList.remove("scale-120", "shadow-xl", "z-10");
    }, 150);
  });

  return btn;
}

add_new_button.addEventListener("click", () => {
  const newFieldName = prompt("Enter a new field name");
  if (!newFieldName) return;

  chrome.storage.local.get("customFields", (data) => {
    const fields = data.customFields || [];
    if (fields.includes(newFieldName)) {
      alert("This field already exists");
    } else {
      renderFields({ newFieldName, isNewField: true });
    }
  });
});

// Run on start
document.addEventListener("DOMContentLoaded", loadAllFromStorage);