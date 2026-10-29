
const STORAGE_KEY = "codestreak_tasks_v1";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const dateLabel = document.getElementById("todayLabel");
const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskCategory = document.getElementById("taskCategory");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

let activeFilter = "all";
let tasks = loadTasks();

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return JSON.parse(saved);
  } catch (error) {
    console.error("Could not load saved tasks:", error);
  }

  return [
    { id: crypto.randomUUID(), title: "Solve one LeetCode problem", category: "DSA", date: today(), completed: false, completedDate: null },
    { id: crypto.randomUUID(), title: "Practice Python for 20 minutes", category: "Python", date: today(), completed: false, completedDate: null },
    { id: crypto.randomUUID(), title: "Make one GitHub contribution", category: "Project", date: today(), completed: false, completedDate: null }
  ];
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getStreak() {
  const completedDays = new Set(
    tasks.filter(task => task.completed && task.completedDate)
      .map(task => task.completedDate)
  );

  let cursor = new Date(`${today()}T12:00:00`);
  const yesterday = new Date(cursor);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDate(yesterday);

  if (!completedDays.has(today()) && !completedDays.has(yesterdayKey)) {
    return 0;
  }

  if (!completedDays.has(today())) cursor = yesterday;

  let streak = 0;
  while (completedDays.has(formatDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function render() {
  const todayTasks = tasks.filter(task => task.date === today());
  const todayCompleted = todayTasks.filter(task => task.completed).length;
  const totalCompleted = tasks.filter(task => task.completed).length;
  const progress = todayTasks.length
    ? Math.round((todayCompleted / todayTasks.length) * 100)
    : 0;

  dateLabel.textContent = new Date().toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });

  document.getElementById("totalCount").textContent = tasks.length;
  document.getElementById("completedCount").textContent = totalCompleted;
  document.getElementById("progressCount").textContent = `${progress}%`;
  document.getElementById("streakCount").textContent = getStreak();
  document.getElementById("progressText").textContent =
    `${todayCompleted} / ${todayTasks.length}`;
  document.getElementById("progressBar").style.width = `${progress}%`;

  const visibleTasks = tasks.filter(task => {
    if (activeFilter === "pending") return !task.completed;
    if (activeFilter === "completed") return task.completed;
    return true;
  });

  taskList.innerHTML = "";

  visibleTasks.forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Complete ${task.title}`);
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const info = document.createElement("div");
    info.className = "task-info";

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;

    const category = document.createElement("span");
    category.className = "task-category";
    category.textContent = task.category;

    info.append(title, category);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    item.append(checkbox, info, deleteButton);
    taskList.appendChild(item);
  });

  emptyState.classList.toggle("hidden", visibleTasks.length !== 0);
}

function toggleTask(id) {
  tasks = tasks.map(task => {
    if (task.id !== id) return task;
    const completed = !task.completed;
    return {
      ...task,
      completed,
      completedDate: completed ? today() : null
    };
  });
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  render();
}

document.getElementById("showFormBtn").addEventListener("click", () => {
  taskForm.classList.remove("hidden");
  taskTitle.focus();
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  taskForm.reset();
  taskForm.classList.add("hidden");
});

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = taskTitle.value.trim();
  if (!title) return;

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    category: taskCategory.value,
    date: today(),
    completed: false,
    completedDate: null
  });

  saveTasks();
  taskForm.reset();
  taskForm.classList.add("hidden");
  activeFilter = "all";

  document.querySelectorAll(".filter").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });

  render();
});

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach(filter => {
      filter.classList.toggle("active", filter === button);
    });
    render();
  });
});

render();
