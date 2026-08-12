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
  roster: document.getElementById("roster"),
  presenceSummary: document.getElementById("presenceSummary"),
  printBtn: document.getElementById("printBtn"),
};

let staffData = null;

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Δεν βρέθηκε: ${path}`);
  return res.json();
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
  if (!items || !items.length) {
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

function renderOrders(orders) {
  els.orders.innerHTML = "";
  if (!orders?.length) {
    els.orders.innerHTML = `<p class="hint">Δεν υπάρχουν παραγγελίες για σήμερα.</p>`;
    return;
  }

  orders.forEach((order) => {
    const names = (order.assigned || [])
      .map((id) => staffById(id)?.name || id)
      .join(", ");
    const div = document.createElement("div");
    div.className = `order ${priorityClass(order.priority)}`;
    div.innerHTML = `
      <div class="order-top">
        <span class="order-id">${order.id} · ${order.client}</span>
        <span class="badge">${order.priority} · ${order.stage} · έως ${order.deadline}</span>
      </div>
      <strong>${order.product}</strong>
      <span class="hint">Ομάδα: ${names || "—"}</span>
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
    const isAbsent = (a.status || "").toLowerCase().includes("απών") ||
      (a.status || "").toLowerCase().includes("απουσ");
    if (isAbsent) absent += 1;
    else present += 1;

    const row = document.createElement("div");
    row.className = "assign-row";
    row.setAttribute("role", "row");
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

function renderRoster() {
  els.roster.innerHTML = "";
  staffData.staff.forEach((p) => {
    const card = document.createElement("div");
    card.className = "person";
    card.innerHTML = `
      <strong>${p.id} · ${p.name}</strong>
      <span>${p.role}</span>
      <span>${p.station}</span>
    `;
    els.roster.appendChild(card);
  });
}

async function loadPlan(dateStr) {
  try {
    const plan = await loadJSON(`data/plans/${dateStr}.json`);
    els.planTitle.textContent = plan.title;
    els.planNotes.textContent = plan.notes || "";
    els.shiftInfo.textContent = `Βάρδια ${staffData.shift}`;
    renderList(els.priorities, plan.priorities, "Χωρίς προτεραιότητες.");
    renderList(els.materials, plan.materialsNeeded, "Χωρίς λίστα υλικών.");
    renderList(els.checklist, plan.endOfDayChecklist, "Χωρίς checklist.");
    renderOrders(plan.orders);
    renderAssignments(plan);
    renderAbsences(plan);
    document.title = `Kastoria — ${plan.title}`;
  } catch (err) {
    els.planTitle.textContent = "Δεν υπάρχει πλάνο για αυτή την ημερομηνία";
    els.planNotes.textContent = "Στείλε παραγγελίες, απουσίες και προτεραιότητες για να ετοιμαστεί.";
    els.shiftInfo.textContent = "";
    els.priorities.innerHTML = "";
    els.materials.innerHTML = "";
    els.orders.innerHTML = "";
    els.assignments.innerHTML = "";
    els.absences.innerHTML = "";
    els.checklist.innerHTML = "";
    els.presenceSummary.textContent = "";
    console.warn(err);
  }
}

async function init() {
  staffData = await loadJSON("data/staff.json");
  renderRoster();
  els.planDate.value = DEFAULT_PLAN;
  await loadPlan(DEFAULT_PLAN);

  els.planDate.addEventListener("change", (e) => {
    loadPlan(e.target.value);
  });

  els.printBtn.addEventListener("click", () => window.print());
}

init();
