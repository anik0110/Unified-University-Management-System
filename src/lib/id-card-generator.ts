import jsPDF from "jspdf";

interface IDCardData {
  name: string;
  enrollmentNo: string;
  program: string;
  semester: number;
  section: string;
  email: string;
  phone: string;
  bloodGroup: string;
  admissionYear: number;
  avatar?: string;
}

export function generateIDCard(data: IDCardData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [86, 130], // Credit card-ish aspect ratio
  });

  const cardW = 86;
  const cardH = 130;

  // ── Background ──
  doc.setFillColor(30, 58, 95); // Navy blue
  doc.rect(0, 0, cardW, 48, "F");

  // Decorative accent bar
  doc.setFillColor(37, 99, 235); // Accent blue
  doc.rect(0, 48, cardW, 3, "F");

  // ── University Title ──
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("UNIFIED UNIVERSITY", cardW / 2, 14, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("MANAGEMENT SYSTEM", cardW / 2, 20, { align: "center" });

  // ── Avatar Circle ──
  const avatarX = cardW / 2;
  const avatarY = 34;
  const avatarR = 10;

  // White circle background
  doc.setFillColor(255, 255, 255);
  doc.circle(avatarX, avatarY, avatarR + 1, "F");

  // Avatar circle
  doc.setFillColor(219, 234, 254); // Light blue
  doc.circle(avatarX, avatarY, avatarR, "F");

  // Initials
  const initials = data.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 95);
  doc.text(initials, avatarX, avatarY + 5, { align: "center" });

  // ── Student Name ──
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(data.name.toUpperCase(), cardW / 2, 58, { align: "center" });

  // ── Role Badge ──
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(cardW / 2 - 12, 61, 24, 6, 3, 3, "F");
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 95);
  doc.text("STUDENT", cardW / 2, 65, { align: "center" });

  // ── Details Section ──
  const detailStartY = 73;
  const labelX = 8;
  const valueX = cardW - 8;
  const lineSpacing = 8;

  const details = [
    { label: "Enrollment No.", value: data.enrollmentNo },
    { label: "Programme", value: data.program.length > 22 ? data.program.slice(0, 22) + "..." : data.program },
    { label: "Semester / Section", value: `Sem ${data.semester} - ${data.section}` },
    { label: "Admission Year", value: String(data.admissionYear) },
    { label: "Blood Group", value: data.bloodGroup },
    { label: "Contact", value: data.phone },
  ];

  details.forEach((item, index) => {
    const y = detailStartY + index * lineSpacing;

    // Alternating background
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(4, y - 4.5, cardW - 8, lineSpacing, "F");
    }

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, labelX, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(item.value, valueX, y, { align: "right" });
  });

  // ── Separator ──
  const sepY = detailStartY + details.length * lineSpacing + 1;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(8, sepY, cardW - 8, sepY);

  // ── Footer ──
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("This is a digitally generated ID card.", cardW / 2, cardH - 6, { align: "center" });
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, cardW / 2, cardH - 3, { align: "center" });

  // ── Download ──
  doc.save(`ID_Card_${data.enrollmentNo}.pdf`);
}
