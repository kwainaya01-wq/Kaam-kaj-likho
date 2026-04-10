import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCOu9B2P4KZus7K910CeNSC0s15Xtb9sNc",
  authDomain: "kaam-likho.firebaseapp.com",
  projectId: "kaam-likho",
  storageBucket: "kaam-likho.firebasestorage.app",
  messagingSenderId: "481596699951",
  appId: "1:481596699951:web:c134f2e01b24f24bc75dda"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let isLoginMode = true;

document.getElementById('toggleBtn').onclick = () => {
    isLoginMode = !isLoginMode;
    const authSection = document.getElementById('authSection');
    if (isLoginMode) {
        authSection.className = "login-theme";
        document.getElementById('authTitle').innerText = "Member Login";
        document.getElementById('mainAuthBtn').innerText = "Login Karein";
        document.getElementById('toggleBtn').innerText = "Naya Account (Sign Up) Karein";
    } else {
        authSection.className = "signup-theme";
        document.getElementById('authTitle').innerText = "Sign Up";
        document.getElementById('mainAuthBtn').innerText = "Sign Up";
        document.getElementById('toggleBtn').innerText = "Login Karein";
    }
};

document.getElementById('mainAuthBtn').onclick = () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const status = document.getElementById('authStatus');

    if(!email || !password) return alert("Email/Password dalo!");
    status.style.display = "block";
    status.className = ""; 
    status.innerText = "Check kar raha hoon...";

    const action = isLoginMode 
        ? signInWithEmailAndPassword(auth, email, password)
        : createUserWithEmailAndPassword(auth, email, password);

    action.catch(err => {
        status.className = "error-msg";
        if (err.code === "auth/invalid-login-credentials" || err.code === "auth/wrong-password") {
            status.innerText = "❌ Password ya Email galat hai!";
        } else if (err.code === "auth/user-not-found") {
            status.innerText = "❌ Account nahi mila!";
        } else {
            status.innerText = "❌ Error: Sab sahi se bhariye!";
        }
    });
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('appContent').style.display = 'block';
        document.getElementById('userEmail').innerText = user.email.split('@')[0];
        loadData(user.uid);
    } else {
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('appContent').style.display = 'none';
    }
});

document.getElementById('logoutBtn').onclick = () => signOut(auth);

window.toggleAndFill = (workerName, element) => {
    document.getElementById('nameInput').value = workerName;
    element.classList.toggle('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

document.getElementById('saveBtn').onclick = async () => {
    const rawName = document.getElementById('nameInput').value.trim();
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
    const date = document.getElementById('dateInput').value;
    const hrs = document.getElementById('hrsInput').value;
    const ot = document.getElementById('otInput').value;
    if (!name || !date) return alert("Naam aur Date zaroori hai!");
    try {
        await addDoc(collection(db, "records"), {
            userId: auth.currentUser.uid,
            name, date, hrs: Number(hrs), ot: Number(ot),
            createdAt: new Date()
        });
        alert("Kaam Save Ho Gaya!");
    } catch (e) { alert(e.message); }
};

window.deleteRecord = async (id) => {
    if(confirm("Mita de?")) await deleteDoc(doc(db, "records", id));
};

window.editRecord = async (id, oldH, oldO) => {
    const nH = prompt("Duty Hours:", oldH);
    const nO = prompt("OT Hours:", oldO);
    if(nH !== null && nO !== null) {
        await updateDoc(doc(db, "records", id), { hrs: Number(nH), ot: Number(nO) });
    }
};

function loadData(uid) {
    const q = query(collection(db, "records"), where("userId", "==", uid));
    onSnapshot(q, (snapshot) => {
        const list = document.getElementById('entryList');
        const dDisp = document.getElementById('totalDutyDisplay');
        const oDisp = document.getElementById('totalOTDisplay');
        let gH = 0, gO = 0, groups = {}; 
        snapshot.forEach(docSnap => {
            const d = docSnap.data();
            gH += Number(d.hrs); gO += Number(d.ot);
            if(!groups[d.name]) groups[d.name] = [];
            groups[d.name].push({ ...d, id: docSnap.id });
        });
        dDisp.innerText = parseFloat((gH / 8).toFixed(1)) + " Din";
        oDisp.innerText = gO + "h";
        list.innerHTML = "";
        for (let worker in groups) {
            let wH = 0, wO = 0, entriesHTML = "";
            groups[worker].sort((a,b) => new Date(b.date) - new Date(a.date));
            groups[worker].forEach(e => {
                wH += e.hrs; wO += e.ot;
                const status = e.hrs === 0 ? "<span style='color:red; font-weight:bold;'>Absent</span>" : `${e.hrs}h | ${e.ot}h`;
                entriesHTML += `<div class="entry-row"><span>${e.date} : ${status}</span><div class="btn-group"><button onclick="event.stopPropagation(); editRecord('${e.id}', ${e.hrs}, ${e.ot})" style="color:blue; border:none; background:none;">Edit</button><button onclick="event.stopPropagation(); deleteRecord('${e.id}')" style="color:red; border:none; background:none;">Del</button></div></div>`;
            });
            const card = document.createElement('div');
            card.className = 'worker-card';
            card.onclick = function() { toggleAndFill(worker, this); };
            card.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center;"><h3>${worker} ✍️</h3><span style="background:#e8f5e9; padding:4px 8px; border-radius:5px; font-weight:bold; color:#2e7d32;">${parseFloat((wH/8).toFixed(1))} Din | ${wO}h</span></div><div class="worker-entries">${entriesHTML}</div>`;
            list.appendChild(card);
        }
    });
}
