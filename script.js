
let mode = "equal";

let equalExpenses = JSON.parse(localStorage.getItem("equalExpenses")) || [];
let customExpenses = JSON.parse(localStorage.getItem("customExpenses")) || [];

let chart;
function scrollToApp() {
  document.querySelector(".container").scrollIntoView({
    behavior: "smooth"
  });
}

function selectMode(selectedMode) {
  mode = selectedMode;

  document.querySelector(".container").scrollIntoView({
    behavior: "smooth"
  });

  renderForm();
  displayExpenses();
  calculateBalances();
}

function renderForm() {
  const form = document.getElementById("form-container");

  if (mode === "equal") {
    form.innerHTML = `
      <input id="name" placeholder="Person Name">
      <input id="amount" type="number" placeholder="Amount">
      <button onclick="addEqualExpense()">Add Expense</button>
    `;
  } else {
    form.innerHTML = `
      <input id="payer" placeholder="Who paid">
      <input id="amount" type="number" placeholder="Amount">
      <input id="for" placeholder="Paid for (You, Friend)">
      <button onclick="addCustomExpense()">Add Expense</button>
    `;
  }
}

function addEqualExpense() {
  const name = document.getElementById("name").value;
  const amount = document.getElementById("amount").value;

  if (!name || !amount) {
    alert("Please fill all fields");
    return;
  }

  equalExpenses.push({ name, amount: parseFloat(amount) });
  localStorage.setItem("equalExpenses", JSON.stringify(equalExpenses));

  document.getElementById("name").value = "";
  document.getElementById("amount").value = "";

  displayExpenses();
  calculateBalances();
}

function addCustomExpense() {
  const payer = document.getElementById("payer").value;
  const amount = document.getElementById("amount").value;
  const forWhom = document.getElementById("for").value.split(",");

  if (!payer || !amount || !forWhom.length) {
    alert("Please fill all fields");
    return;
  }

  customExpenses.push({
    payer,
    amount: parseFloat(amount),
    forWhom: forWhom.map(p => p.trim())
  });

  localStorage.setItem("customExpenses", JSON.stringify(customExpenses));

  document.getElementById("payer").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("for").value = "";

  displayExpenses();
  calculateBalances();
}
function displayExpenses() {
  const list = document.getElementById("expenseList");
  list.innerHTML = "";

  const data = mode === "equal" ? equalExpenses : customExpenses;

  data.forEach((exp, index) => {
    const li = document.createElement("li");

    const text = document.createElement("span");

    if (mode === "equal") {
      text.textContent = `${exp.name} paid ₹${exp.amount}`;
    } else {
      text.textContent = `${exp.payer} paid ₹${exp.amount} for ${exp.forWhom.join(", ")}`;
    }

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => deleteExpense(index);

    li.appendChild(text);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

function deleteExpense(index) {
  if (mode === "equal") {
    equalExpenses.splice(index, 1);
    localStorage.setItem("equalExpenses", JSON.stringify(equalExpenses));
  } else {
    customExpenses.splice(index, 1);
    localStorage.setItem("customExpenses", JSON.stringify(customExpenses));
  }

  displayExpenses();
  calculateBalances();
}

function calculateBalances() {
  if (mode === "equal") {
    calculateEqual();
  } else {
    calculateCustom();
  }
}

function calculateEqual() {
  const balances = {};
  let total = 0;

  equalExpenses.forEach(exp => {
    total += exp.amount;
    balances[exp.name] = (balances[exp.name] || 0) + exp.amount;
  });

  const people = Object.keys(balances);
  const share = people.length ? total / people.length : 0;

  const list = document.getElementById("balanceList");
  list.innerHTML = "";

  people.forEach(person => {
    const diff = balances[person] - share;
    const li = document.createElement("li");

    if (diff > 0) {
      li.textContent = `${person} gets ₹${diff.toFixed(2)}`;
    } else {
      li.textContent = `${person} owes ₹${Math.abs(diff).toFixed(2)}`;
    }

    list.appendChild(li);
  });

  renderChart(balances);
}
function calculateCustom() {
  const balances = {};

  customExpenses.forEach(exp => {
    const split = exp.amount / exp.forWhom.length;

    exp.forWhom.forEach(p => {
      p = p.trim().toLowerCase();
      balances[p] = (balances[p] || 0) - split;
    });

    const payer = exp.payer.trim().toLowerCase();
    balances[payer] = (balances[payer] || 0) + exp.amount;
  });

  const list = document.getElementById("balanceList");
  list.innerHTML = "";

  // 🔥 Separate creditors & debtors
  let creditors = [];
  let debtors = [];

  Object.keys(balances).forEach(person => {
    let amount = balances[person];

    if (amount > 0) {
      creditors.push({ person, amount });
    } else if (amount < 0) {
      debtors.push({ person, amount: Math.abs(amount) });
    }
  });

  // 🔥 SETTLEMENT LOGIC
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    let debtor = debtors[i];
    let creditor = creditors[j];

    let settleAmount = Math.min(debtor.amount, creditor.amount);

    const li = document.createElement("li");
    li.textContent = `${debtor.person} owes ${creditor.person} ₹${settleAmount.toFixed(2)}`;
    list.appendChild(li);

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  renderChart(balances);
}

function renderChart(balances) {
  const ctx = document.getElementById("expenseChart").getContext("2d");

  const totals = {};

  Object.keys(balances).forEach(person => {
    if (balances[person] > 0) {
      totals[person] = balances[person];
    }
  });

  const names = Object.keys(totals);
  const amounts = Object.values(totals);

  
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: names,
      datasets: [{
        data: amounts,
        backgroundColor: [
          "#4D96FF",
          "#FF6B6B",
          "#6BCB77",
          "#FFD93D",
          "#C77DFF"
        ]
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: "#ecf0f1"
          }
        }
      }
    }
  });
}

function clearAll() {
  if (confirm("Delete all expenses?")) {
    equalExpenses = [];
    customExpenses = [];

    localStorage.removeItem("equalExpenses");
    localStorage.removeItem("customExpenses");

    displayExpenses();
    calculateBalances();
  }
}

renderForm();
displayExpenses();
calculateBalances();
