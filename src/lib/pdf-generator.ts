import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReceiptData {
  transactionId: string;
  date: string;
  name: string;
  email: string;
  amount: number;
  type: string;
  description: string;
}

export function generatePDFReceipt(data: ReceiptData) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(41, 128, 185);
  doc.text("University Management System", 14, 22);
  
  doc.setFontSize(16);
  doc.setTextColor(44, 62, 80);
  doc.text("Payment Receipt", 14, 32);
  
  // Date & Config
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Receipt Date: ${new Date().toLocaleDateString()}`, 14, 42);
  doc.text(`Transaction ID: ${data.transactionId}`, 14, 48);

  // Bill To
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text("Billed To:", 14, 60);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Name: ${data.name}`, 14, 66);
  doc.text(`Email: ${data.email}`, 14, 72);

  // Line Items
  autoTable(doc, {
    startY: 82,
    head: [["Description", "Category", "Amount"]],
    body: [
      [data.description, data.type, `Rs. ${data.amount.toFixed(2)}`]
    ],
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text(`Total Paid: Rs. ${data.amount.toFixed(2)}`, 14, finalY + 15);
  doc.text("Status: SUCCESSFUL", 14, finalY + 23);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("This is a computer-generated receipt and does not require a physical signature.", 14, 280);

  // Download
  doc.save(`Receipt_${data.transactionId}.pdf`);
}
