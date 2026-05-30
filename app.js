const API_BASE = "http://127.0.0.1:8000";

const LABELS = ["Важно", "Работа", "Учеба", "Дом", "Личное", "Другое"];

const state = {
  user: null,
  tasks: [],
  selectedFilter: "",
  search: ""
};

const authView = document.querySelector("#authView");
const tasksView = document.querySelector("#tasksView");

const loginTab = document.querySelector("#loginTab");
const registerTab = document.querySelector("#registerTab");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const authMessage = document.querySelector("#authMessage");

const helloText = document.querySelector("#helloText");
const logoutButton = document.querySelector("#logoutButton");

const taskForm = document.querySelector("#taskForm");
const taskTitle = document.querySelector("#taskTitle");
const createLabels = document.querySelector("#createLabels");
const labelFilter = document.querySelector("#labelFilter");
const searchInput = document.querySelector("#searchInput");
const tasksList = document.querySelector("#tasksList");
const emptyText = document.querySelector("#emptyText");
const tasksMessage = document.querySelector("#tasksMessage");
const taskTemplate = document.querySelector("#taskTemplate");

function getToken() {
  return localStorage.getItem("access_token");
}

function setToken(token) {
  localStorage.setItem("access_token", token);
}

function clearToken() {
  localStorage.removeItem("access_token");
}

async function api(path, options = {}) {
  const headers = {
    ...(options.headers || {})
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.message || "Ошибка запроса");
  }

  return data;
}

async function apiJson(path, options = {}) {
  return api(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}

function showAuthMessage(message) {
  authMessage.textContent = message || "";
}

function showTasksMessage(message) {
  tasksMessage.textContent = message || "";
}

function showLoginForm() {
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  showAuthMessage("");
}

function showRegisterForm() {
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  showAuthMessage("");
}

function showTasksView() {
  authView.classList.add("hidden");
  tasksView.classList.remove("hidden");

  const name = state.user?.username || state.user?.email || "";
  helloText.textContent = name ? `Привет, ${name}!` : "";
}

function showAuthView() {
  tasksView.classList.add("hidden");
  authView.classList.remove("hidden");
}

function getCheckedLabels(container) {
  return [...container.querySelectorAll("input[type='checkbox']:checked")].map(
    (input) => input.value
  );
}

function createLabelCheckbox(label, checked = false) {
  const wrapper = document.createElement("label");
  wrapper.className = "checkbox-label";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.value = label;
  input.checked = checked;

  const text = document.createElement("span");
  text.textContent = label;

  wrapper.append(input, text);

  return wrapper;
}

function renderCreateLabels() {
  createLabels.innerHTML = "";

  for (const label of LABELS) {
    createLabels.append(createLabelCheckbox(label));
  }
}

function renderFilterOptions() {
  labelFilter.innerHTML = '<option value="">Все метки</option>';

  for (const label of LABELS) {
    const option = document.createElement("option");
    option.value = label;
    option.textContent = label;
    labelFilter.append(option);
  }

  labelFilter.value = state.selectedFilter;
}

function renderTasks() {
  tasksList.innerHTML = "";

  emptyText.classList.toggle("hidden", state.tasks.length > 0);

  for (const task of state.tasks) {
    const node = taskTemplate.content.cloneNode(true);

    const input = node.querySelector(".task-edit-input");
    const labelsContainer = node.querySelector(".task-labels");
    const saveButton = node.querySelector(".save-button");
    const deleteButton = node.querySelector(".delete-button");

    input.value = task.title;

    const labelEditor = document.createElement("div");
    labelEditor.className = "task-label-editor";

    const taskLabels = task.labels || [];

    for (const label of LABELS) {
      labelEditor.append(createLabelCheckbox(label, taskLabels.includes(label)));
    }

    labelsContainer.append(labelEditor);

    saveButton.addEventListener("click", async () => {
      try {
        showTasksMessage("");

        const title = input.value.trim();
        const labels = getCheckedLabels(labelEditor);

        await apiJson(`/tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title, labels })
        });

        await loadTasks();
      } catch (error) {
        showTasksMessage(error.message);
      }
    });

    deleteButton.addEventListener("click", async () => {
      try {
        showTasksMessage("");

        await api(`/tasks/${task.id}`, {
          method: "DELETE"
        });

        await loadTasks();
      } catch (error) {
        showTasksMessage(error.message);
      }
    });

    tasksList.append(node);
  }
}

async function loadCurrentUser() {
  const data = await api("/auth/me");
  state.user = data;
}

async function loadTasks() {
  const params = new URLSearchParams({
    limit: "100",
    offset: "0"
  });

  if (state.search) {
    params.set("search", state.search);
  }

  if (state.selectedFilter) {
    params.set("label", state.selectedFilter);
  }

  const data = await api(`/tasks?${params.toString()}`);

  state.tasks = data.items || [];
  renderTasks();
}

async function init() {
  renderCreateLabels();
  renderFilterOptions();

  if (!getToken()) {
    showAuthView();
    return;
  }

  try {
    await loadCurrentUser();
    showTasksView();
    await loadTasks();
  } catch {
    clearToken();
    showAuthView();
  }
}

loginTab.addEventListener("click", showLoginForm);
registerTab.addEventListener("click", showRegisterForm);

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    showAuthMessage("");

    const email = document.querySelector("#loginEmail").value.trim();
    const password = document.querySelector("#loginPassword").value;

    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const data = await api("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData
    });

    setToken(data.access_token);

    await loadCurrentUser();
    showTasksView();
    await loadTasks();
  } catch (error) {
    showAuthMessage(error.message);
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    showAuthMessage("");

    const username = document.querySelector("#registerUsername").value.trim();
    const email = document.querySelector("#registerEmail").value.trim();
    const password = document.querySelector("#registerPassword").value;

    await apiJson("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: username || null,
        email,
        password
      })
    });

    showLoginForm();
    document.querySelector("#loginEmail").value = email;
    document.querySelector("#loginPassword").value = "";
    showAuthMessage("Аккаунт создан. Теперь войди.");
  } catch (error) {
    showAuthMessage(error.message);
  }
});

logoutButton.addEventListener("click", () => {
  clearToken();
  state.user = null;
  state.tasks = [];
  showAuthView();
  showLoginForm();
});

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    showTasksMessage("");

    const title = taskTitle.value.trim();
    const labels = getCheckedLabels(createLabels);

    await apiJson("/tasks", {
      method: "POST",
      body: JSON.stringify({
        title,
        description: null,
        is_done: false,
        labels
      })
    });

    taskTitle.value = "";

    createLabels
      .querySelectorAll("input[type='checkbox']")
      .forEach((input) => {
        input.checked = false;
      });

    await loadTasks();
  } catch (error) {
    showTasksMessage(error.message);
  }
});

labelFilter.addEventListener("change", async () => {
  state.selectedFilter = labelFilter.value;

  try {
    await loadTasks();
  } catch (error) {
    showTasksMessage(error.message);
  }
});

let searchTimer = null;

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(async () => {
    state.search = searchInput.value.trim();

    try {
      await loadTasks();
    } catch (error) {
      showTasksMessage(error.message);
    }
  }, 300);
});

init();
