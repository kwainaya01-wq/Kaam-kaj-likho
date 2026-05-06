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
// --- SEARCH BOX VIP CONTROL ---
window.addEventListener('DOMContentLoaded', () => {const searchBox = document.getElementById('dashboardSearch');
    if (searchBox) {
        // Agar URL mein ?pro_user=yes NAHI hai, toh search box hide kardo
        if (!window.location.href.includes("?pro_user=yes")) {
            searchBox.style.display = 'none';
        } else {
            // Agar VIP user hai, toh dikhao
            searchBox.style.display = 'block';
        }
    }
});

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
    status.innerText = "Check kar raha hoon...";
    const action = isLoginMode 
        ? signInWithEmailAndPassword(auth, email, password)
        : createUserWithEmailAndPassword(auth, email, password);
    action.catch(err => {
        status.className = "error-msg";
        status.innerText = "❌ Login Error! Sab sahi se bhariye.";
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

window.toggleAndFill = (fullName, element) => {
    const shortName = fullName.includes(' (') ? fullName.split(' (')[0] : fullName; 
    document.getElementById('nameInput').value = shortName;
    element.classList.toggle('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

document.getElementById('saveBtn').onclick = async () => {
    const rawName = document.getElementById('nameInput').value.trim();
    let name = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
    const dateValue = document.getElementById('dateInput').value;
    const hrs = document.getElementById('hrsInput').value;
    const ot = document.getElementById('otInput').value;
    if (!name || !dateValue) return alert("Naam aur Date zaroori hai!");
    const dateObj = new Date(dateValue);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthYear = monthNames[dateObj.getMonth()] + "-" + dateObj.getFullYear();
    const notebookName = `${name} (${monthYear})`;
    try {
        await addDoc(collection(db, "records"), {
            userId: auth.currentUser.uid,
            name: notebookName, date: dateValue, hrs: Number(hrs), ot: Number(ot),
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

// --- PDF DOWNLOAD FUNCTION FIXED FOR WEBVIEW ---
window.downloadPDF = (workerId, workerName) => {
    try {
          // --- VIP LOCK YAHAN START ---
    if (!window.location.href.includes("?pro_user=yes")) {
        let userWantsPro = confirm("Ye PDF feature sirf ₹49 wale Pro App mein available hai. Kya aap abhi Pro App download karna chahte hain?");
        
        if (userWantsPro == true) {
            window.location.href = "https://play.google.com/store/apps/details?id=com.wahid.paidapp";
        }
        return; // Normal user yahan se ruk jayega, aage ka PDF code nahi chalega
    } // <--- YE WALA BRACKET AAPKE CODE MEIN MISSING HAI!
    // --- VIP LOCK YAHAN KHATAM ---
      
    // --- VIP LOCK YAHAN KHATAM ---

        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF();
        const element = document.getElementById(workerId);
        
        doc.setFontSize(18);
        doc.text(`Kaam Kaj Hisab - ${workerName}`, 10, 20);
        doc.setFontSize(10);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 28);
        doc.line(10, 32, 200, 32);

        const rows = element.querySelectorAll('.entry-row');
        let y = 42;
        doc.setFont("helvetica", "bold");
        doc.text("Date", 10, y);
        doc.text("Duty | OT", 70, y);
        y += 10;
        doc.setFont("helvetica", "normal");

        rows.forEach(row => {
            if (y > 280) { doc.addPage(); y = 20; }
            const text = row.querySelector('span').innerText;
            const parts = text.split(' : ');
            doc.text(parts[0], 10, y);
            doc.text(parts[1], 70, y);
            y += 8;
        });

        y += 5;
        doc.line(10, y, 200, y);
        y += 10;
        
        const totalSpan = element.querySelector('span[style*="background"]');
        const total = totalSpan ? totalSpan.innerText : "N/A";
        
        doc.setFont("helvetica", "bold");
        doc.text(`Total: ${total}`, 10, y);

        // --- APK / WEBVIEW DOWNLOAD TRIGGER ---
        const pdfData = doc.output('datauristring');
        
        // Link create karke turant click karna WebView ke liye sabse best hai
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = pdfData;
        downloadAnchor.download = `${workerName}_Hisab.pdf`;
        downloadAnchor.style.display = 'none'; // Chupa hua link
        document.body.appendChild(downloadAnchor);
        
        downloadAnchor.click(); // Trigger click
        
        // Memory saaf karne ke liye delay se remove karein
        setTimeout(() => {
            document.body.removeChild(downloadAnchor);
        }, 300);

        //alert("PDF download shuru ho gaya!");
    } catch (err) {
        console.error(err);
        alert("PDF Error: Library load nahi ho payi. Ek baar internet check karein.");
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
                const st = e.hrs === 0 ? "<span style='color:red;'>Absent</span>" : `${e.hrs}h | ${e.ot}h`;
                entriesHTML += `<div class="entry-row"><span>${e.date} : ${st}</span><div class="btn-group"><button onclick="event.stopPropagation(); editRecord('${e.id}', ${e.hrs}, ${e.ot})" style="color:blue; border:none; background:none;">Edit</button><button onclick="event.stopPropagation(); deleteRecord('${e.id}')" style="color:red; border:none; background:none;">Del</button></div></div>`;
            });
            const card = document.createElement('div');
            card.className = 'worker-card';
            card.id = 'card-' + worker.replace(/\s+/g, '-').replace(/[()]/g, '');
            card.onclick = function() { toggleAndFill(worker, this); };
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; margin-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <h3 style="margin:0;">${worker} ✍️</h3>
                        <button onclick="event.stopPropagation(); downloadPDF('${card.id}', '${worker}')" style="background:#28a745; color:white; border:none; border-radius:4px; padding:3px 8px; cursor:pointer; font-size:11px;">PDF</button>
                    </div>
                    <span style="background:#e8f5e9; padding:4px 8px; border-radius:5px; font-weight:bold; color:#2e7d32; font-size:13px;">${parseFloat((wH/8).toFixed(1))} Din | ${wO}h</span>
                </div>
                <div class="worker-entries">${entriesHTML}</div>`;
            list.appendChild(card);
        }
    });
                        }
