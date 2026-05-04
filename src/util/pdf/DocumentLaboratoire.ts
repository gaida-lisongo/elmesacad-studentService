import Document from "./Document";

export type DocumentLaboratoireDescriptionSection = {
  title: string;
  contenu: string[];
};

export type DocumentLaboratoirePayload = {
  student?: {
    nom: string;
    sexe: string;
    ville: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    nationalite?: string;
    dateNaissance?: string;
  };
  parcour?: {
    promotion: string;
    systeme: string;
    matricule: string;
    annee: string;
  };
  contact?: {
    email: string;
    telephone: string;
    adresse: string;
  };
  document?: {
    type: string;
    ressource: string;
    detail: string;
    reference: string;
    dateCreate: string;
    other?: string;
  };
  laboratoire: {
    designation: string;
    montant: number | null;
    description?: string;
    descriptionSections?: DocumentLaboratoireDescriptionSection[];
  };
  verificationUrl: string;
};

class DocumentLaboratoire extends Document {
  private student: {
    nom: string;
    sexe: string;
    ville: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    nationalite?: string;
    dateNaissance?: string;
  } = {
    nom: "Etudiant",
    sexe: "M",
    ville: "Kinshasa",
  };

  private parcour: { promotion: string; systeme: string; matricule: string; annee: string } = {
    promotion: "Promotion",
    systeme: "LMD",
    matricule: "Non renseigne",
    annee: "Non renseignee",
  };

  private contact: { email: string; telephone: string; adresse: string } = {
    email: "Non renseigne",
    telephone: "Non renseigne",
    adresse: "Non renseignee",
  };

  private document: { type: string; ressource: string; detail: string; reference: string; dateCreate: string; other?: string } = {
    type: "Autorisation de laboratoire",
    ressource: "Laboratoire",
    detail: "Document d'autorisation d'acces au laboratoire",
    reference: "LAB-0001",
    dateCreate: "01/01/2026",
  };

  private laboratoire: DocumentLaboratoirePayload["laboratoire"] = {
    designation: "Laboratoire",
    montant: null,
    descriptionSections: undefined,
  };

  private verificationUrl = "";

  constructor(payload: DocumentLaboratoirePayload | null = null) {
    super();

    if (payload) {
      this.parseData(payload);
    }
  }

  parseData(data: DocumentLaboratoirePayload) {
    this.student = {
      ...this.student,
      ...(data.student ?? {}),
    };
    this.parcour = {
      ...this.parcour,
      ...(data.parcour ?? {}),
    };
    this.contact = {
      ...this.contact,
      ...(data.contact ?? {}),
    };
    this.document = {
      ...this.document,
      ...(data.document ?? {}),
    };
    this.laboratoire = {
      ...this.laboratoire,
      ...data.laboratoire,
    };
    this.verificationUrl = data.verificationUrl;
  }

  private infoTable(rows: Array<[string, string]>) {
    return {
      table: {
        widths: [110, "*"],
        body: rows.map(([label, value]) => [
          { text: label, color: "#6B7280", margin: [0, 3, 0, 3] },
          { text: value, bold: true, margin: [0, 3, 0, 3] },
        ]),
      },
      layout: "lightHorizontalLines",
    };
  }

  async generate() {
    await this.background();
    await this.buildFooter(this.verificationUrl);

    const identityRows: Array<[string, string]> = [
      ["Nom complet", this.student.nom],
      ["Sexe", this.student.sexe === "F" ? "Féminin" : "Masculin"],
      ["Ville / lieu de naissance", this.student.ville],
      ["Matricule", this.parcour.matricule],
    ];
    if (this.student.email) identityRows.push(["E-mail", this.student.email]);
    if (this.student.telephone) identityRows.push(["Téléphone", this.student.telephone]);
    if (this.student.adresse) identityRows.push(["Adresse", this.student.adresse]);
    if (this.student.nationalite) identityRows.push(["Nationalité", this.student.nationalite]);
    if (this.student.dateNaissance) identityRows.push(["Date de naissance", this.student.dateNaissance]);

    const descriptifStack: Record<string, unknown>[] = [];
    const sections = this.laboratoire.descriptionSections;
    if (sections?.length) {
      descriptifStack.push({ text: "Descriptif du produit", style: "subtitle", margin: [0, 0, 0, 6] });
      for (const sec of sections) {
        descriptifStack.push({ text: sec.title, bold: true, margin: [0, 8, 0, 4] });
        for (const line of sec.contenu ?? []) {
          descriptifStack.push({ text: line, fontSize: this.chart.sm, margin: [0, 1, 0, 3] });
        }
      }
    }

    await this.adminLayout([
      [
        {
          text: `AUTORISATION DE LABORATOIRE\nN/Réf ` + `INBTP/BTP/LAB/${(new Date).getFullYear()}/${(Date.now()).toString().slice(-5)}`,
          style: "title",
          alignment: "center",
          colSpan: 3,
          margin: [0, 0, 0, 8],
        },
        "",
        "",
      ],
      [
        {
          text: `Document émis le ${this.document.dateCreate}`,
          alignment: "center",
          colSpan: 3,
          margin: [0, 0, 0, 16],
          border: [false, false, false, false],
        },
        "",
        "",
      ],
      [
        {
          text: [
            "La présente autorisation confirme que l'étudiant ",
            { text: this.student.nom, bold: true }, ", matriculé ", {bold: true, text: this.parcour.matricule}, ",",
            " est en ordre pour accéder au laboratoire ",
            { text: this.laboratoire.designation, bold: true },
            ".",
          ],
          colSpan: 3,
          margin: [0, 0, 0, 14],
          border: [false, false, false, false],
        },
        "",
        "",
      ],
      [
        {
          stack: [
            { text: "Identité de l'étudiant", style: "subtitle", margin: [0, 0, 0, 6] },
            this.infoTable(identityRows),
          ],
          colSpan: 3,
          border: [false, false, false, false],
          margin: [0, 0, 0, 14],
        },
        "",
        "",
      ],
      ...(descriptifStack.length > 1
        ? [
            [
              {
                stack: descriptifStack,
                colSpan: 3,
                border: [false, false, false, false],
                margin: [0, 0, 0, 14],
              },
              "",
              "",
            ],
          ]
        : []),
      [
        {
          stack: [
            { text: "Laboratoire", style: "subtitle", margin: [0, 0, 0, 6] },
            this.infoTable([
              ["Designation", this.laboratoire.designation],
              ["Montant", typeof this.laboratoire.montant === "number" ? `${this.laboratoire.montant} USD` : "Non renseigne"],
              ["Detail", this.document.detail],
            ]),
          ],
          colSpan: 3,
          border: [false, false, false, false],
          margin: [0, 0, 0, 14],
        },
        "",
        "",
      ],
      [
        {
          columns: [
            {
              width: "*",
              text: ''
            },
            {
              width: "*",
              stack: [
                { text: "Parcours", style: "subtitle", margin: [0, 0, 0, 6] },
                this.infoTable([
                  ["Promotion", this.parcour.promotion],
                  ["Systeme", this.parcour.systeme],
                  ["Annee", this.parcour.annee],
                ]),
              ],
            },
          ],
          colSpan: 3,
          border: [false, false, false, false],
        },
        "",
        "",
      ],
    ]);
  }
}

export default DocumentLaboratoire;
