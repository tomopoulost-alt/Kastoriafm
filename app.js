const DEFAULT_PLAN = "2026-08-12";

const els = {
  planDate: document.getElementById("planDate"),
  planTitle: document.getElementById("planTitle"),
  planNotes: document.getElementById("planNotes"),
  shiftInfo: document.getElementById("shiftInfo"),
  priorities: document.getElementById("priorities"),
  materials: document.getElementById("materials"),
  orders: document.getElementById("orders"),
  assignments: document.getElementById("assignments"),
  absences: document.getElementById("absences"),
  checklist: document.getElementById("checklist"),
  presenceSummary: document.getElementById("presenceSummary"),
  stationFlow: document.getElementById("stationFlow"),
  printBtn: document.getElementById("printBtn"),
};

let staffData = null;

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Missing ${path}`);
  return res.json();
}

async function getStaff() {
  try {
    return await loadJSON("data/staff.json");
  } catch {
    return window.KASTORIA_EMBED?.staff;
  }
}

async function getPlan(dateStr) {
  try {
    return await loadJSON(`data/plans/${dateStr}.json`);
  } catch {
    return window.KASTORIA_EMBED?.plans?.[dateStr];
  }
}

function priorityClass(priority) {
  const p = (priority || "").toLowerCase();
  if (p.includes("υψηλ")) return "high";
  if (p.includes("μεσα")) return "medium";
  return "low";
}

function staffById(id) {
  return staffData.staff.find((s) => s.id === id);
}

function renderList(el, items, emptyText) {
  el.innerHTML = "";
  if (!items?.length) {
    const li = document.createElement("li");
    li.textContent = emptyText;
    el.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    el.appendChild(li);
  });
}

function renderStationFlow(plan) {
  const counts = {};
  plan.assignments.forEach((a) => {
    const key = a.station || "Άλλο";
    counts[key] = (counts[key] || 0) + 1;
  });

  const order = [
    "Κοπή",
    "Συναρμολόγηση",
    "Τριβείο",
    "Βαφείο",
    "Σχεδιαστήριο",
    "QC / Παράδοση",
    "Αποθήκη",
    "Γραφείο / Επόπτευση",
  ];

  const entries = order
    .filter((name) => counts[name])
    .map((name) => [name, counts[name]]);

  els.stationFlow.innerHTML = "";
  entries.forEach(([name, count], i) => {
    const div = document.createElement("div");
    div.className = "station-chip";
    div.style.animationDelay = `${0.05 * i}s`;
    div.innerHTML = `<strong>${count}</strong><span>${name}</span>`;
    els.stationFlow.appendChild(div);
  });
}

function renderOrders(orders) {
  els.orders.innerHTML = "";
  if (!orders?.length) {
    els.orders.innerHTML = `<p class="hint">Δεν υπάρχουν παραγγελίες για σήμερα.</p>`;
    return;
  }

  orders.forEach((order, i) => {
    const names = (order.assigned || [])
      .map((id) => staffById(id)?.name || id)
      .join(" · ");
    const div = document.createElement("article");
    div.className = "order";
    div.style.animationDelay = `${0.04 * i}s`;
    div.innerHTML = `
      <div>
        <div class="order-id">${order.id}</div>
        <div class="order-meta">${order.client}</div>
      </div>
      <div>
        <strong>${order.product}</strong>
        <div class="order-meta">Ομάδα: ${names || "—"}</div>
      </div>
      <div class="priority ${priorityClass(order.priority)}">
        <b>${order.priority}</b>
        ${order.stage} · έως ${order.deadline}
      </div>
    `;
    els.orders.appendChild(div);
  });
}

function renderAssignments(plan) {
  els.assignments.innerHTML = `
    <div class="assign-row head" role="row">
      <span>ID</span><span>Όνομα</span><span>Εργασία</span><span>Σταθμός</span><span>Κατάσταση</span>
    </div>
  `;

  let present = 0;
  let absent = 0;

  plan.assignments.forEach((a) => {
    const person = staffById(a.staffId);
    const isAbsent =
      (a.status || "").toLowerCase().includes("απών") ||
      (a.status || "").toLowerCase().includes("απουσ");
    if (isAbsent) absent += 1;
    else present += 1;

    const row = document.createElement("div");
    row.className = "assign-row";
    row.innerHTML = `
      <span class="pid">${a.staffId}</span>
      <span class="name"><strong>${person?.name || a.staffId}</strong></span>
      <span class="role">${person?.role || ""}</span>
      <span class="task">${a.task}</span>
      <span class="station">${a.station}</span>
      <span class="status ${isAbsent ? "absent" : "present"}">${a.status}</span>
    `;
    els.assignments.appendChild(row);
  });

  els.presenceSummary.textContent = `${present} παρόντες · ${absent} απουσίες`;
}

function renderAbsences(plan) {
  els.absences.innerHTML = "";
  if (!plan.absences?.length) {
    const li = document.createElement("li");
    li.textContent = "Καμία απουσία.";
    els.absences.appendChild(li);
    return;
  }
  plan.absences.forEach((abs) => {
    const person = staffById(abs.staffId);
    const li = document.createElement("li");
    li.textContent = `${person?.name || abs.staffId}: ${abs.reason || "απουσία"}`;
    els.absences.appendChild(li);
  });
}

async function loadPlan(dateStr) {
  const plan = await getPlan(dateStr);
  if (!plan) {
    els.planTitle.textContent = "Δεν υπάρχει πλάνο για αυτή την ημέρα";
    els.planNotes.textContent = "Ετοιμάζουμε νέο πλάνο μόλις δοθούν παραγγελίες και απουσίες.";
    els.shiftInfo.textContent = `Βάρδια ${staffData.shift}`;
    els.presenceSummary.textContent = "—";
    els.stationFlow.innerHTML = "";
    els.priorities.innerHTML = "";
    els.materials.innerHTML = "";
    els.orders.innerHTML = "";
    els.assignments.innerHTML = "";
    els.absences.innerHTML = "";
    els.checklist.innerHTML = "";
    return;
  }

  els.planTitle.textContent = plan.title;
  els.planNotes.textContent = plan.notes || "";
  els.shiftInfo.textContent = `Βάρδια ${staffData.shift}`;
  renderList(els.priorities, plan.priorities, "Χωρίς προτεραιότητες.");
  renderList(els.materials, plan.materialsNeeded, "Χωρίς λίστα υλικών.");
  renderList(els.checklist, plan.endOfDayChecklist, "Χωρίς checklist.");
  renderOrders(plan.orders);
  renderAssignments(plan);
  renderAbsences(plan);
  renderStationFlow(plan);
  document.title = `Kastoria — ${plan.title}`;
}

async function init() {
  staffData = await getStaff();
  if (!staffData) {
    els.planTitle.textContent = "Σφάλμα φόρτωσης";
    els.planNotes.textContent = "Δεν βρέθηκαν δεδομένα προσωπικού.";
    return;
  }

  els.planDate.value = DEFAULT_PLAN;
  await loadPlan(DEFAULT_PLAN);

  els.planDate.addEventListener("change", (e) => loadPlan(e.target.value));
  els.printBtn.addEventListener("click", () => window.print());
}

init();
