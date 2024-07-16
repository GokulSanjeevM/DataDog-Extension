const inputField = document.getElementById("inputField");
const dropdown = document.getElementById("dropdown");
const selectedItemsContainer = document.getElementById(
  "selectedItemsContainer"
);
const tableBody = document.getElementById("tableBody");
const dropdownIcon = document.getElementById("dropdownIcon");

function createAlert(title, message) {
  SDP.showAlert({
    title,
    message,
    action: "Ok",
  });
}

const bodyData = JSON.stringify({
  name: "Webhook",
  url: "https://sdpondemand.manageengine.com/app/testing1/executefunction/DD_Webhook?zapikey=1003.c8b146e1ab4ae0becfc0217f031ede30.d877980f7b9b297646bf83860e61ef50",
});

function onClickCreateReq(event) {
  event.preventDefault();

  const selectedMonitors = Array.from(
    selectedItemsContainer.querySelectorAll(".selected-item")
  ).map((item) => ({ id: item.dataset.value, name: item.textContent }));

  if (selectedMonitors.length === 0) {
    createAlert("Error", "Please select at least one monitor.");
    return;
  }

  SDP.invokeUrl({
    url: "https://api.us5.datadoghq.com/api/v1/integration/webhooks/configuration/webhooks",
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    payload: bodyData,
    connectionLinkName: "datadog_test02",
  })
    .then((res) => {
      createAlert("Success", "Webhook created successfully");
      selectedMonitors.forEach((monitor) => {
        webConfig(monitor.id, monitor.name);
      });
      selectedItemsContainer.innerHTML = "";
      inputField.value = "";
    })
    .catch((err) => {
      console.error("API Call Error:", err);
      createAlert("Error", "Failed to create webhook. Please try again later.");
    });
}

function webConfig(monitorId, monitorName) {
  SDP.invokeUrl({
    url: `https://api.us5.datadoghq.com/api/v1/monitor/${monitorId}`,
    method: "put",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    connectionLinkName: "datadog_test02",
    payload: JSON.stringify({
      message: "@webhook-Webhook",
    }),
  })
    .then((res) => {
      createAlert("Success", "Webhook integrated successfully");
      addMonitorToTable(monitorName);
      removeMonitorFromDropdown(monitorId);
    })
    .catch((err) => {
      console.error("API Call Error:", err);
      createAlert(
        "Error",
        "Failed to integrate webhook. Please try again later."
      );
    });
}

function addMonitorToTable(name, index) {
  const trimmedName = name.replace("×", "").trim();

  const existsInTable = Array.from(
    tableBody.querySelectorAll("td:nth-child(2)")
  ).some((td) => td.textContent === trimmedName);

  if (!existsInTable) {
    const row = document.createElement("tr");
    const cellIndex = document.createElement("td");
    const cellName = document.createElement("td");

    cellIndex.textContent = index || tableBody.rows.length + 1;
    cellName.textContent = trimmedName;

    row.appendChild(cellIndex);
    row.appendChild(cellName);
    tableBody.appendChild(row);
  }
}

function populateDropdown(data) {
  dropdown.innerHTML = "";
  let tableIndex = tableBody.rows.length + 1;

  data.forEach(async (item) => {
    const message = await fetchMonitorMessage(item.id);
    if (message.includes("@webhook-Webhook")) {
      addMonitorToTable(item.name, tableIndex++);
    } else {
      const option = document.createElement("div");
      option.classList.add("option");
      option.textContent = item.name;
      option.dataset.value = item.id;
      option.addEventListener("click", () =>
        addItem(option.dataset.value, option.textContent)
      );
      dropdown.appendChild(option);
    }
  });

  dropdown.style.display = "block";
}

function fetchMonitorMessage(monitorId) {
  return SDP.invokeUrl({
    url: `https://api.us5.datadoghq.com/api/v1/monitor/${monitorId}`,
    method: "get",
    headers: {
      Accept: "application/json",
    },
    connectionLinkName: "datadog_test02",
  })
    .then((res) => res.response.message)
    .catch((err) => {
      console.error("API Call Error:", err);
      createAlert("Error", "Failed to fetch monitor message.");
      return null;
    });
}

function addItem(value, text) {
  const existingItems = Array.from(
    selectedItemsContainer.querySelectorAll(".selected-item")
  );
  if (existingItems.some((item) => item.dataset.value === value)) {
    return;
  }

  const item = document.createElement("div");
  item.classList.add("selected-item");
  item.dataset.value = value;
  item.innerHTML = `<span>${text}</span><span class="remove-btn">&times;</span>`;
  item
    .querySelector(".remove-btn")
    .addEventListener("click", () => item.remove());
  selectedItemsContainer.appendChild(item);
}

function removeMonitorFromDropdown(monitorId) {
  const optionToRemove = Array.from(dropdown.querySelectorAll(".option")).find(
    (option) => option.dataset.value === monitorId
  );
  if (optionToRemove) {
    optionToRemove.remove();
  }
}

inputField.addEventListener("focus", () => {
  dropdown.style.display = "block";
});

inputField.addEventListener("input", () => {
  const filter = inputField.value.toLowerCase();
  const options = dropdown.querySelectorAll(".option");
  options.forEach((option) => {
    option.style.display = option.textContent.toLowerCase().includes(filter)
      ? ""
      : "none";
  });
});

inputField.addEventListener("click", () => {
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
});

dropdownIcon.addEventListener("click", () => {
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
});
