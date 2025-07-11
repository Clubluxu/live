firebase.auth().onAuthStateChanged(user => {
      if (!user) window.location.href = "login.html";
    });



    let currentExpenseDate = null;

    document.getElementById("showExpenseTable").addEventListener("click", async () => {
      document.getElementById("expenseControls").style.display = "block";

      const snap = await firebase.firestore().collection("accounting")
        .where("status", "==", "Open")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        const dateStr = doc.id;
        currentExpenseDate = dateStr;
        document.getElementById("expenseDateLabel").textContent = dateStr;
        document.getElementById("expenseTableHeader").style.display = "flex";
        renderExpenseTable(dateStr);
      }
    });

document.getElementById("startExpense").addEventListener("click", async () => {
  const inputDate = document.getElementById("customExpenseDate").value;
  if (!inputDate) return alert("กรุณาเลือกวันที่ก่อนเริ่ม");

  const docRef = firebase.firestore().collection("accounting").doc(inputDate);
  const doc = await docRef.get();

  if (doc.exists) {
    alert("มีข้อมูลในวันที่เลือกอยู่แล้ว กรุณาเลือกวันอื่น");
    return;
  }

  await docRef.set({
    status: "Open",
    createdAt: firebase.firestore.Timestamp.fromDate(new Date(inputDate))
  });

  currentExpenseDate = inputDate;
  document.getElementById("expenseDateLabel").textContent = inputDate;
  document.getElementById("expenseTableHeader").style.display = "flex";
  renderExpenseTable(inputDate);
});


    document.getElementById("loadHistory").addEventListener("click", async () => {
      const start = document.getElementById("historyPickerStart").value;
      const end = document.getElementById("historyPickerEnd").value;
      if (!start || !end) return alert("กรุณาเลือกช่วงวันที่");

      const area = document.getElementById("expenseTableArea");
      area.innerHTML = "";

      let current = new Date(start);
      const endDate = new Date(end);

      while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0];
        const entriesSnap = await firebase.firestore().collection("accounting").doc(dateStr).collection("entries").orderBy("createdAt", "desc").get();
        if (!entriesSnap.empty) {
          const tableWrapper = document.createElement("div");
          tableWrapper.innerHTML = `
  <div style="display:flex; justify-content:space-between; align-items:center; background:#eef; padding:5px 10px; border-radius:5px;">
    <div>
      <h3 style="margin:0; display:inline;">📅 วันที่ ${dateStr}</h3>
      <span id="total-${dateStr}" style="font-weight:bold; margin-left:10px;"></span>
    </div>
    <button class="close-expense-history" style="background:red; color:white; border:none; padding:3px 8px; border-radius:5px;">❌</button>
  </div>
  <table>
    <thead>
      <tr><th>รายการ</th><th>จำนวน</th><th>หมายเหตุ</th><th>ดำเนินการ</th></tr>
    </thead>
    <tbody id="tb-${dateStr}"></tbody>
  </table>
`;
          area.appendChild(tableWrapper);
entriesSnap.forEach(doc => {
  // ...
});
const accountingDoc = await firebase.firestore().collection("accounting").doc(dateStr).get();
const total = accountingDoc.exists && accountingDoc.data().total
  ? parseFloat(accountingDoc.data().total)
  : 0;

const totalSpan = tableWrapper.querySelector(`#total-${dateStr}`);
if (totalSpan) {
  totalSpan.textContent = `💰 ยอดรวมทั้งหมด: ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท`;
}


          // ✅ เพิ่ม event ปิด
const closeBtn = tableWrapper.querySelector(".close-expense-history");
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    tableWrapper.remove(); // ✅ ปิดกล่องนี้
  });
}

          // 🔁 ดึง total ของวันนั้นจาก Firestore


const totalDiv = document.createElement("div");
totalDiv.style = "margin-top: 5px; font-weight: bold; font-size: 15px;";
tableWrapper.appendChild(totalDiv);


          const tbody = tableWrapper.querySelector("tbody");
          entriesSnap.forEach(doc => {
            const d = doc.data();
            const row = document.createElement("tr");
            row.innerHTML = `
              <td><input type="text" value="${d.description}" disabled></td>
              <td><input type="number" value="${d.amount}" disabled></td>
              <td><input type="text" value="${d.note}" disabled></td>
              <td>
                <button class="edit-btn">✏️</button>
                <button class="delete-btn">🗑️</button>
              </td>
            `;
            tbody.appendChild(row);

            const inputs = row.querySelectorAll("input");
            row.querySelector(".edit-btn").addEventListener("click", () => {
              inputs.forEach(i => i.disabled = false);
              row.querySelector(".edit-btn").style.display = "none";
              const saveBtn = document.createElement("button");
              saveBtn.textContent = "Save";
              saveBtn.className = "save-btn";
              const cancelBtn = document.createElement("button");
              cancelBtn.textContent = "Cancel";
              cancelBtn.className = "cancel-btn";
              const actionTd = row.querySelector("td:last-child");
              actionTd.appendChild(saveBtn);
              actionTd.appendChild(cancelBtn);

              cancelBtn.addEventListener("click", () => {
                inputs.forEach(i => i.disabled = true);
                saveBtn.remove();
                cancelBtn.remove();
                row.querySelector(".edit-btn").style.display = "inline";
              });

              saveBtn.addEventListener("click", async () => {
                await firebase.firestore().collection("accounting").doc(dateStr).collection("entries").doc(doc.id).update({
                  description: inputs[0].value,
                  amount: parseFloat(inputs[1].value),
                  note: inputs[2].value
                });
                inputs.forEach(i => i.disabled = true);
                saveBtn.remove();
                cancelBtn.remove();
                row.querySelector(".edit-btn").style.display = "inline";
                
                // ✅ คำนวณยอดรวมใหม่ทั้งหมดของวันนั้น
const newSnap = await firebase.firestore()
  .collection("accounting")
  .doc(dateStr)
  .collection("entries")
  .get();

let newTotal = 0;
newSnap.forEach(e => {
  const data = e.data();
  if (!isNaN(data.amount)) newTotal += parseFloat(data.amount);
});

// ✅ อัปเดต Firestore
await firebase.firestore().collection("accounting").doc(dateStr).update({
  total: newTotal
});

// ✅ อัปเดตยอดรวมบนหน้าจอ (ถ้าอยู่ใน div ด้านล่าง)
const totalDiv = row.closest("div").querySelector("div:last-child");
if (totalDiv) {
  totalDiv.textContent = `💰 ยอดรวมทั้งหมด: ${newTotal.toFixed(2)} บาท`;
}

              });
            });

            row.querySelector(".delete-btn").addEventListener("click", async () => {
              await firebase.firestore().collection("accounting").doc(dateStr).collection("entries").doc(doc.id).delete();
              row.remove();
            });
          });
        }
        current.setDate(current.getDate() + 1);
      }
    });
async function renderExpenseTable(dateStr) {
  const area = document.getElementById("expenseTableArea");
  area.innerHTML = "";

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>รายการ</th>
        <th>จำนวน</th>
        <th>หมายเหตุ</th>
        <th>ดำเนินการ</th>
      </tr>
    </thead>
    <tbody id="entryBody"></tbody>
  `;
  area.appendChild(table);

  const tbody = table.querySelector("tbody");

  const summaryDiv = document.createElement("div");
  summaryDiv.id = "expenseSummary";
  summaryDiv.style = "margin-top: 10px; font-weight: bold; font-size: 16px;";
  summaryDiv.textContent = "💰 ยอดรวมทั้งหมด: 0.00 บาท";
  area.appendChild(summaryDiv);

  function updateTotalSummary() {
  const inputs = area.querySelectorAll("tbody input[type='number']");
  let total = 0;
  inputs.forEach(input => {
    const val = parseFloat(input.value);
    if (!isNaN(val)) total += val;
  });
  summaryDiv.textContent = `💰 ยอดรวมทั้งหมด: ${total.toFixed(2)} บาท`;

  // ✅ อัปเดต Firestore
  firebase.firestore().collection("accounting").doc(dateStr).update({
    total: total
  }).catch(err => {
    console.error("❌ อัปเดตยอดรวมล้มเหลว:", err);
  });
}

  const addNewInputRow = () => {
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
      <td><input type="text" placeholder="เช่น ค่าน้ำมัน"></td>
      <td><input type="number" placeholder="0.00"></td>
      <td><input type="text" placeholder="หมายเหตุเพิ่มเติม"></td>
      <td>
        <button class="save-btn">💾 Save</button>
        <button class="cancel-btn">✖ Cancel</button>
      </td>
    `;
    tbody.prepend(newRow);

    const inputs = newRow.querySelectorAll("input");
    const saveBtn = newRow.querySelector(".save-btn");
    const cancelBtn = newRow.querySelector(".cancel-btn");

    cancelBtn.addEventListener("click", () => newRow.remove());

    saveBtn.addEventListener("click", async () => {
      const description = inputs[0].value.trim();
      const amount = parseFloat(inputs[1].value);
      const note = inputs[2].value.trim();

      if (!description || isNaN(amount)) {
        alert("กรุณากรอกข้อมูลให้ครบ");
        return;
      }

      try {
        const docRef = await firebase.firestore()
          .collection("accounting")
          .doc(dateStr)
          .collection("entries")
          .add({ description, amount, note, createdAt: firebase.firestore.FieldValue.serverTimestamp() });

        inputs.forEach(i => i.disabled = true);
        newRow.querySelector("td:last-child").innerHTML = `
          <button class="edit-btn">✏️ Edit</button>
          <button class="delete-btn">🗑️ Delete</button>
        `;

        const editBtn = newRow.querySelector(".edit-btn");
        const deleteBtn = newRow.querySelector(".delete-btn");

        editBtn.addEventListener("click", () => {
          inputs.forEach(i => i.disabled = false);
          editBtn.style.display = "none";
          const saveAgain = document.createElement("button");
          saveAgain.textContent = "Save";
          const cancel = document.createElement("button");
          cancel.textContent = "Cancel";
          const td = newRow.querySelector("td:last-child");
          td.appendChild(saveAgain);
          td.appendChild(cancel);

          cancel.addEventListener("click", () => {
            inputs.forEach(i => i.disabled = true);
            saveAgain.remove();
            cancel.remove();
            editBtn.style.display = "inline";
          });

          saveAgain.addEventListener("click", async () => {
            await firebase.firestore().collection("accounting").doc(dateStr).collection("entries").doc(docRef.id).update({
              description: inputs[0].value,
              amount: parseFloat(inputs[1].value),
              note: inputs[2].value
            });
            inputs.forEach(i => i.disabled = true);
            saveAgain.remove();
            cancel.remove();
            editBtn.style.display = "inline";
            updateTotalSummary(); // ✅ อัปเดตยอดรวม
          });
        });

        deleteBtn.addEventListener("click", async () => {
          await firebase.firestore().collection("accounting").doc(dateStr).collection("entries").doc(docRef.id).delete();
          newRow.remove();
          updateTotalSummary(); // ✅ อัปเดตยอดรวม
        });

        addNewInputRow(); // 🔁 เพิ่มแถวใหม่ต่อทันที
        updateTotalSummary(); // ✅ รวมยอดใหม่

      } catch (err) {
        console.error("❌ บันทึกไม่สำเร็จ:", err);
        alert("บันทึกข้อมูลล้มเหลว");
      }
    });
  };

  addNewInputRow(); // 🔁 เริ่มด้วยแถวใหม่

  const entriesSnap = await firebase.firestore()
    .collection("accounting")
    .doc(dateStr)
    .collection("entries")
    .orderBy("createdAt", "desc")
    .get();

  entriesSnap.forEach(doc => {
    const d = doc.data();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="text" value="${d.description}" disabled></td>
      <td><input type="number" value="${d.amount}" disabled></td>
      <td><input type="text" value="${d.note || ''}" disabled></td>
      <td>
        <button class="edit-btn">✏️ Edit</button>
        <button class="delete-btn">🗑️ Delete</button>
      </td>
    `;
    tbody.appendChild(row);

    const inputs = row.querySelectorAll("input");
    const editBtn = row.querySelector(".edit-btn");
    const deleteBtn = row.querySelector(".delete-btn");

    editBtn.addEventListener("click", () => {
      inputs.forEach(i => i.disabled = false);
      editBtn.style.display = "none";
      const saveAgain = document.createElement("button");
      saveAgain.textContent = "Save";
      const cancel = document.createElement("button");
      cancel.textContent = "Cancel";
      const td = row.querySelector("td:last-child");
      td.appendChild(saveAgain);
      td.appendChild(cancel);

      cancel.addEventListener("click", () => {
        inputs.forEach(i => i.disabled = true);
        saveAgain.remove();
        cancel.remove();
        editBtn.style.display = "inline";
      });

      saveAgain.addEventListener("click", async () => {
        await firebase.firestore().collection("accounting").doc(dateStr).collection("entries").doc(doc.id).update({
          description: inputs[0].value,
          amount: parseFloat(inputs[1].value),
          note: inputs[2].value
        });
        inputs.forEach(i => i.disabled = true);
        saveAgain.remove();
        cancel.remove();
        editBtn.style.display = "inline";
        updateTotalSummary(); // ✅ อัปเดตยอดรวม
      });
    });

    deleteBtn.addEventListener("click", async () => {
      await firebase.firestore().collection("accounting").doc(dateStr).collection("entries").doc(doc.id).delete();
      row.remove();
      updateTotalSummary(); // ✅ อัปเดตยอดรวม
    });
  });

  updateTotalSummary(); // ✅ เรียกตอนโหลดข้อมูล
}



document.getElementById("endTable").addEventListener("click", async () => {
      if (!currentExpenseDate) return;
      await firebase.firestore().collection("accounting").doc(currentExpenseDate).update({ status: "Closed" });
      alert("✅ ปิดตารางแล้ว");
    });

    document.getElementById("deleteTable").addEventListener("click", async () => {
      if (!currentExpenseDate) return;
      const confirmed = confirm("ต้องการลบตารางนี้ทั้งหมดหรือไม่?");
      if (!confirmed) return;
      const entriesRef = firebase.firestore().collection("accounting").doc(currentExpenseDate).collection("entries");
      const snap = await entriesRef.get();
      const batch = firebase.firestore().batch();
      snap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      await firebase.firestore().collection("accounting").doc(currentExpenseDate).delete();
      document.getElementById("expenseTableArea").innerHTML = "";
      document.getElementById("expenseDateLabel").textContent = "";
      document.getElementById("expenseTableHeader").style.display = "none";
      alert("🗑️ ลบตารางเรียบร้อยแล้ว");
    });

function showSection(sectionId) {
  const sections = [
    "expenseControls",
    "wageControls",
    "summaryControls",
    "profitControls",
    "dailySummaryContainer"
  ];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === sectionId) ? "block" : "none";
  });
}


document.getElementById("showExpenseTable").addEventListener("click", () => showSection("expenseControls"));
document.getElementById("showWageTable").addEventListener("click", () => showSection("wageControls"));
// เพิ่มส่วนอื่น ๆ เมื่อมีเมนูใหม่
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnSummary").addEventListener("click", showDailySummary);
});

async function loadDailySummary() {
  const db = firebase.firestore();
  const tbody = document.querySelector("#dailySummaryTable tbody");
  tbody.innerHTML = "";

  const summaryMap = new Map();
  const allDates = new Set();

  // 1. จาก accounting
  const accSnap = await db.collection("accounting").get();
  accSnap.forEach(doc => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate();
    if (!createdAt) return;
    const date = createdAt.toISOString().split("T")[0];

    allDates.add(date);
    if (!summaryMap.has(date)) summaryMap.set(date, {});
    const s = summaryMap.get(date);
    s.expense = (s.expense || 0) + parseFloat(data.total || 0);
  });

  // 2. จาก summaries
  const sumSnap = await db.collectionGroup("summaries").get();
  sumSnap.forEach(doc => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate();
    if (!createdAt) return;
    const date = createdAt.toISOString().split("T")[0];

    allDates.add(date);
    if (!summaryMap.has(date)) summaryMap.set(date, {});
    const s = summaryMap.get(date);
    s.rake = (s.rake || 0) + parseFloat(data.totalRake || 0);
    s.tip = (s.tip || 0) + parseFloat(data.totalTip || 0);
  });

  // 3. จาก dailyWages
  const dwSnap = await db.collection("dailyWages").get();
  dwSnap.forEach(doc => {
    const data = doc.data();
    const date = data.date;
    if (!date) return;

    allDates.add(date);
    if (!summaryMap.has(date)) summaryMap.set(date, {});
    const s = summaryMap.get(date);
    s.wage = (s.wage || 0) + parseFloat(data.totalPayout || 0);
  });

  // 4. แสดงตารางเรียงจากวันที่ล่าสุด
  const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));
  sortedDates.forEach(date => {
    const s = summaryMap.get(date) || {};
    const expense = s.expense || 0;
    const rake = s.rake || 0;
    const tip = s.tip || 0;
    const wage = s.wage || 0;
    const profit = rake + tip - wage - expense;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${date}</td>
      <td>${expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td>${rake.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td>${tip.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td>${wage.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td>${profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
    `;
    tbody.appendChild(row);
  });
}




function showDailySummary() {
  showSection("dailySummaryContainer");
  loadDailySummary(); // ต้องอยู่หลังประกาศ function
}


const customDateInput = document.getElementById("customExpenseDate");
const customDateDisplay = document.getElementById("customExpenseDateDisplay");

customDateInput.addEventListener("change", () => {
  customDateDisplay.textContent = customDateInput.value || "--/--/----";
});

document.getElementById("historyPickerStart").addEventListener("change", e => {
  document.getElementById("historyStartDisplay").textContent = e.target.value || "--/--/----";
});

document.getElementById("historyPickerEnd").addEventListener("change", e => {
  document.getElementById("historyEndDisplay").textContent = e.target.value || "--/--/----";
});

async function loadTotalProfit() {
  const db = firebase.firestore();
  const tbody = document.querySelector("#totalProfitTable tbody");
  tbody.innerHTML = "";

  const monthlyMap = new Map();

  const accSnap = await db.collection("accounting").get();
  accSnap.forEach(doc => {
    const d = doc.data();
    const date = d.createdAt?.toDate();
    if (!date) return;
    const monthKey = date.toISOString().slice(0, 7); // yyyy-MM
    if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, { expense: 0, rake: 0, tip: 0, wage: 0 });
    monthlyMap.get(monthKey).expense += parseFloat(d.total || 0);
  });

  const sumSnap = await db.collectionGroup("summaries").get();
  sumSnap.forEach(doc => {
    const d = doc.data();
    const date = d.createdAt?.toDate();
    if (!date) return;
    const monthKey = date.toISOString().slice(0, 7);
    if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, { expense: 0, rake: 0, tip: 0, wage: 0 });
    monthlyMap.get(monthKey).rake += parseFloat(d.totalRake || 0);
    monthlyMap.get(monthKey).tip += parseFloat(d.totalTip || 0);
  });

  const wageSnap = await db.collection("dailyWages").get();
  wageSnap.forEach(doc => {
    const d = doc.data();
    const dateStr = d.date;
    if (!dateStr) return;
    const monthKey = dateStr.slice(0, 7);
    if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, { expense: 0, rake: 0, tip: 0, wage: 0 });
    monthlyMap.get(monthKey).wage += parseFloat(d.totalPayout || 0);
  });

  // ✅ รวมยอดทั้งหมดก่อนแสดง
  let totalExpense = 0, totalRake = 0, totalTip = 0, totalWage = 0;

  const sortedMonths = Array.from(monthlyMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  sortedMonths.forEach(([month, data]) => {
    const profit = data.rake + data.tip - data.expense - data.wage;

    const row = document.createElement("tr");
    row.innerHTML = `
  <td>${month}</td>
  <td>${data.expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
  <td>${data.rake.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
  <td>${data.tip.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
  <td>${data.wage.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
  <td>${profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
`;

    tbody.appendChild(row);

    // ✅ สะสมรวม
    totalExpense += data.expense;
    totalRake += data.rake;
    totalTip += data.tip;
    totalWage += data.wage;
  });

  const netProfit = totalRake + totalTip - totalExpense - totalWage;

  // ✅ แสดงผลรวมบนหัวตาราง
  document.getElementById("sumExpense").textContent = totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 });
document.getElementById("sumRake").textContent = totalRake.toLocaleString('en-US', { minimumFractionDigits: 2 });
document.getElementById("sumTip").textContent = totalTip.toLocaleString('en-US', { minimumFractionDigits: 2 });
document.getElementById("sumWage").textContent = totalWage.toLocaleString('en-US', { minimumFractionDigits: 2 });
document.getElementById("sumProfit").textContent = netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 });

}
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnSummary").addEventListener("click", showDailySummary);
  document.getElementById("btnProfit").addEventListener("click", showTotalProfit);

  // ✅ เรียกผลกำไรรวมทันที
  showTotalProfit();
});


function showTotalProfit() {
  showSection("profitControls");
  loadTotalProfit();
}












