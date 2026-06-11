import type { AppData, BibleClass, Lesson, Student } from "./types"
import { generateSchedule } from "./scheduler"

/* ── CLASSES ──────────────────────────────────────────────────────────────── */

const baseClasses: BibleClass[] = [
  { id: "cl-1",   name: "Classe 1",       order: 1, description: "Ishingiro ry'Ubukristo — 16 amasomo." },
  { id: "cl-2",   name: "Classe 2",       order: 2, description: "Iterambere mu Mwuka — 14 amasomo." },
  { id: "cl-3a",  name: "Classe 3 Pt 1",  order: 3, description: "Ubuzima bw'Umukristo (igice cya mbere) — 10 amasomo." },
  { id: "cl-3b",  name: "Classe 3 Pt 2",  order: 4, description: "Ubuzima bw'Umukristo (igice cya kabiri) — 6 amasomo." },
  { id: "cl-4a",  name: "Classe 4 Pt 1",  order: 5, description: "Intego n'Ubutumwa (igice cya mbere, ibice 3: L5+L4+L2) — 11 amasomo." },
  { id: "cl-4b",  name: "Classe 4 Pt 2",  order: 6, description: "Intego n'Ubutumwa (igice cya kabiri) — 4 amasomo." },
  { id: "cl-5",   name: "Classe 5",       order: 7, description: "Gukorera Imana — 8 amasomo." },
  { id: "cl-6",   name: "Classe 6",       order: 8, description: "Pt 1 na Pt 2 (L5 buri gice) — 10 amasomo." },
  { id: "cl-7",   name: "Classe 7",       order: 9, description: "Ubuhamya — 4 amasomo." },
]

/* ── LESSONS ──────────────────────────────────────────────────────────────── */

function ls(id: string, classId: string, order: number, title: string, reference = ""): Lesson {
  return { id, classId, title, order, description: "", reference }
}

const baseLessons: Lesson[] = [
  /* ── Classe 1 (16 lessons — full titles provided) ── */
  ls("ls-1-01",  "cl-1",  1,  "Kumenya Agakiza",                             "Jean 3:16"),
  ls("ls-1-02",  "cl-1",  2,  "Imbabazi Pt 1",                               "Epheso 2:8-9"),
  ls("ls-1-03",  "cl-1",  3,  "Imbabazi Pt 2",                               "Abaroma 5:1"),
  ls("ls-1-04",  "cl-1",  4,  "Gukura mu Mwuka",                             "2 Petero 3:18"),
  ls("ls-1-05",  "cl-1",  5,  "Gusenga",                                     "Matayo 6:5-15"),
  ls("ls-1-06",  "cl-1",  6,  "Gutekereza ku Ijambo ry'IMANA Pt 1",          "Zaburi 1:2"),
  ls("ls-1-07",  "cl-1",  7,  "Gutekereza ku Ijambo ry'IMANA Pt 2",          "Yosuwa 1:8"),
  ls("ls-1-08",  "cl-1",  8,  "Umwuka Wera",                                 "Ibyakozwe 1:8"),
  ls("ls-1-09",  "cl-1",  9,  "Uko twakuzura Umwuka Wera Pt 1",              "Ibyakozwe 2:4"),
  ls("ls-1-10",  "cl-1",  10, "Uko twakuzura Umwuka Wera Pt 2",              "Abagalatiya 5:22"),
  ls("ls-1-11",  "cl-1",  11, "Ubusabane hagati y'abana b'IMANA",            "1 Yohana 1:7"),
  ls("ls-1-12",  "cl-1",  12, "Urukundo",                                    "1 Abakorinto 13"),
  ls("ls-1-13",  "cl-1",  13, "Umubatizo wa Gikristo",                       "Matayo 28:19"),
  ls("ls-1-14",  "cl-1",  14, "Ifunguro Ryera",                              "1 Abakorinto 11:23-26"),
  ls("ls-1-15",  "cl-1",  15, "Amaturo n'Icyacumi",                          "Malaki 3:10"),
  ls("ls-1-16",  "cl-1",  16, "Gukorera IMANA",                              "1 Abakorinto 12:4-7"),

  /* ── Classe 2 (14 lessons) ── */
  ls("ls-2-01",  "cl-2",  1,  "Lesson 1",  ""),
  ls("ls-2-02",  "cl-2",  2,  "Lesson 2",  ""),
  ls("ls-2-03",  "cl-2",  3,  "Lesson 3",  ""),
  ls("ls-2-04",  "cl-2",  4,  "Lesson 4",  ""),
  ls("ls-2-05",  "cl-2",  5,  "Lesson 5",  ""),
  ls("ls-2-06",  "cl-2",  6,  "Lesson 6",  ""),
  ls("ls-2-07",  "cl-2",  7,  "Lesson 7",  ""),
  ls("ls-2-08",  "cl-2",  8,  "Lesson 8",  ""),
  ls("ls-2-09",  "cl-2",  9,  "Lesson 9",  ""),
  ls("ls-2-10",  "cl-2",  10, "Lesson 10", ""),
  ls("ls-2-11",  "cl-2",  11, "Lesson 11", ""),
  ls("ls-2-12",  "cl-2",  12, "Lesson 12", ""),
  ls("ls-2-13",  "cl-2",  13, "Lesson 13", ""),
  ls("ls-2-14",  "cl-2",  14, "Lesson 14", ""),

  /* ── Classe 3 Pt 1 (10 lessons — count not specified, defaulting to 10) ── */
  ls("ls-3a-01", "cl-3a", 1,  "Lesson 1",  ""),
  ls("ls-3a-02", "cl-3a", 2,  "Lesson 2",  ""),
  ls("ls-3a-03", "cl-3a", 3,  "Lesson 3",  ""),
  ls("ls-3a-04", "cl-3a", 4,  "Lesson 4",  ""),
  ls("ls-3a-05", "cl-3a", 5,  "Lesson 5",  ""),
  ls("ls-3a-06", "cl-3a", 6,  "Lesson 6",  ""),
  ls("ls-3a-07", "cl-3a", 7,  "Lesson 7",  ""),
  ls("ls-3a-08", "cl-3a", 8,  "Lesson 8",  ""),
  ls("ls-3a-09", "cl-3a", 9,  "Lesson 9",  ""),
  ls("ls-3a-10", "cl-3a", 10, "Lesson 10", ""),

  /* ── Classe 3 Pt 2 (6 lessons) ── */
  ls("ls-3b-01", "cl-3b", 1,  "Lesson 1",  ""),
  ls("ls-3b-02", "cl-3b", 2,  "Lesson 2",  ""),
  ls("ls-3b-03", "cl-3b", 3,  "Lesson 3",  ""),
  ls("ls-3b-04", "cl-3b", 4,  "Lesson 4",  ""),
  ls("ls-3b-05", "cl-3b", 5,  "Lesson 5",  ""),
  ls("ls-3b-06", "cl-3b", 6,  "Lesson 6",  ""),

  /* ── Classe 4 Pt 1 (11 lessons: section 1 = 5, section 2 = 4, section 3 = 2) ── */
  ls("ls-4a-01", "cl-4a", 1,  "Icya 1 — Lesson 1", ""),
  ls("ls-4a-02", "cl-4a", 2,  "Icya 1 — Lesson 2", ""),
  ls("ls-4a-03", "cl-4a", 3,  "Icya 1 — Lesson 3", ""),
  ls("ls-4a-04", "cl-4a", 4,  "Icya 1 — Lesson 4", ""),
  ls("ls-4a-05", "cl-4a", 5,  "Icya 1 — Lesson 5", ""),
  ls("ls-4a-06", "cl-4a", 6,  "Icya 2 — Lesson 1", ""),
  ls("ls-4a-07", "cl-4a", 7,  "Icya 2 — Lesson 2", ""),
  ls("ls-4a-08", "cl-4a", 8,  "Icya 2 — Lesson 3", ""),
  ls("ls-4a-09", "cl-4a", 9,  "Icya 2 — Lesson 4", ""),
  ls("ls-4a-10", "cl-4a", 10, "Icya 3 — Lesson 1", ""),
  ls("ls-4a-11", "cl-4a", 11, "Icya 3 — Lesson 2", ""),

  /* ── Classe 4 Pt 2 (4 lessons) ── */
  ls("ls-4b-01", "cl-4b", 1,  "Lesson 1", ""),
  ls("ls-4b-02", "cl-4b", 2,  "Lesson 2", ""),
  ls("ls-4b-03", "cl-4b", 3,  "Lesson 3", ""),
  ls("ls-4b-04", "cl-4b", 4,  "Lesson 4", ""),

  /* ── Classe 5 (8 lessons) ── */
  ls("ls-5-01",  "cl-5",  1,  "Lesson 1", ""),
  ls("ls-5-02",  "cl-5",  2,  "Lesson 2", ""),
  ls("ls-5-03",  "cl-5",  3,  "Lesson 3", ""),
  ls("ls-5-04",  "cl-5",  4,  "Lesson 4", ""),
  ls("ls-5-05",  "cl-5",  5,  "Lesson 5", ""),
  ls("ls-5-06",  "cl-5",  6,  "Lesson 6", ""),
  ls("ls-5-07",  "cl-5",  7,  "Lesson 7", ""),
  ls("ls-5-08",  "cl-5",  8,  "Lesson 8", ""),

  /* ── Classe 6 (10 lessons: Pt 1 = 5, Pt 2 = 5) ── */
  ls("ls-6-01",  "cl-6",  1,  "Pt 1 — Lesson 1", ""),
  ls("ls-6-02",  "cl-6",  2,  "Pt 1 — Lesson 2", ""),
  ls("ls-6-03",  "cl-6",  3,  "Pt 1 — Lesson 3", ""),
  ls("ls-6-04",  "cl-6",  4,  "Pt 1 — Lesson 4", ""),
  ls("ls-6-05",  "cl-6",  5,  "Pt 1 — Lesson 5", ""),
  ls("ls-6-06",  "cl-6",  6,  "Pt 2 — Lesson 1", ""),
  ls("ls-6-07",  "cl-6",  7,  "Pt 2 — Lesson 2", ""),
  ls("ls-6-08",  "cl-6",  8,  "Pt 2 — Lesson 3", ""),
  ls("ls-6-09",  "cl-6",  9,  "Pt 2 — Lesson 4", ""),
  ls("ls-6-10",  "cl-6",  10, "Pt 2 — Lesson 5", ""),

  /* ── Classe 7 (4 lessons) ── */
  ls("ls-7-01",  "cl-7",  1,  "Lesson 1", ""),
  ls("ls-7-02",  "cl-7",  2,  "Lesson 2", ""),
  ls("ls-7-03",  "cl-7",  3,  "Lesson 3", ""),
  ls("ls-7-04",  "cl-7",  4,  "Lesson 4", ""),
]

/* ── STUDENTS (60 unique — parsed from the BCC Ghana registration form) ────── */
/* Birthdays: yyyy-mm-dd. Year=2000 used when only month/day was given on form. */

const baseStudents: Student[] = [
  { id: "st-001", firstName: "Merveille",        lastName: "Arikungoma",         email: "",                                        phone: "",               birthday: "2000-06-22", classId: null, status: "active", notes: "France" },
  { id: "st-002", firstName: "Etienne",           lastName: "Mwumvaneza",         email: "mwumvaneza.ETIENNE@um6p.ma",              phone: "+212620443501",  birthday: "2000-07-17", classId: null, status: "active", notes: "Morocco" },
  { id: "st-003", firstName: "Ange Noella",       lastName: "Uwijuru",            email: "angenoella78@gmail.com",                  phone: "0465496657",     birthday: "2001-12-24", classId: null, status: "active", notes: "Belgium (Bruxelles)" },
  { id: "st-004", firstName: "Philomene",         lastName: "Iraguha",            email: "iraguhaphilomene@gmail.com",              phone: "+250791324701",  birthday: "2000-10-05", classId: null, status: "active", notes: "Ghana" },
  { id: "st-005", firstName: "Alexia",            lastName: "Uwase",              email: "amutsobekazi2004@gmail.com",              phone: "795182839",      birthday: "2004-06-06", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-006", firstName: "Raissa",            lastName: "Cyuzuzo",            email: "cyuzuzoraissa87@gmail.com",               phone: "+32467633017",   birthday: "2009-03-17", classId: null, status: "active", notes: "Belgium (Bruxelles)" },
  { id: "st-007", firstName: "Inès",              lastName: "Munyambo",           email: "munyambines@gmail.com",                   phone: "+32485458317",   birthday: "1984-08-08", classId: null, status: "active", notes: "Belgium/Leuven" },
  { id: "st-008", firstName: "Josette",           lastName: "Umwali",             email: "umwalij@gmail.com",                       phone: "+250788352905",  birthday: "2000-01-01", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-009", firstName: "Daniel",            lastName: "Kwizera Mutsinzi",   email: "cloviskwizera5@gmail.com",                phone: "0780607789",     birthday: "1999-09-05", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-010", firstName: "Bernice",           lastName: "Ingabire",           email: "ingabire_b@soshgic.edu.gh",               phone: "+25762332275",   birthday: "2000-12-29", classId: null, status: "active", notes: "Ghana, Tema" },
  { id: "st-011", firstName: "Cynthia",           lastName: "Mugisha",            email: "mugisha_c@soshgic.edu.gh",                phone: "+233268741292",  birthday: "2000-05-07", classId: null, status: "active", notes: "Burundi / Ghana" },
  { id: "st-012", firstName: "Elsie Logan",       lastName: "Igiraneza",          email: "igiraneza_e@soshgic.edu.gh",              phone: "+25761181677",   birthday: "2000-07-01", classId: null, status: "active", notes: "Ghana, Tema" },
  { id: "st-013", firstName: "Alphonsine",        lastName: "Nininahazwe",        email: "alphonsinenininahazwe5@gmail.com",         phone: "+25776335283",   birthday: "2000-05-20", classId: null, status: "active", notes: "Burundi" },
  { id: "st-014", firstName: "Daniel",            lastName: "Ruzindana",          email: "danieldana81@gmail.com",                  phone: "+212774881873",  birthday: "2000-07-01", classId: null, status: "active", notes: "Morocco, Tetouan" },
  { id: "st-015", firstName: "Leïlla",            lastName: "Kanani Keza",        email: "kezaleilla67@gmail.com",                  phone: "+250795340956",  birthday: "2000-11-10", classId: null, status: "active", notes: "Kenya" },
  { id: "st-016", firstName: "Jolie",             lastName: "Gahire Nsenga",      email: "gahirensengajolie@gmail.com",             phone: "0794998825",     birthday: "2000-03-09", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-017", firstName: "Adeline",           lastName: "Umukundwa",          email: "aumukundwa47@gmail.com",                  phone: "+250790321642",  birthday: "2000-08-09", classId: null, status: "active", notes: "Ghana" },
  { id: "st-018", firstName: "Ange Bérénice",     lastName: "Majambere",          email: "berenicemajambere140@gmail.com",           phone: "+212622283395",  birthday: "2000-06-08", classId: null, status: "active", notes: "Burundi/Bujumbura" },
  { id: "st-019", firstName: "George",            lastName: "Kuzara",             email: "Kuzarageorge3@gmail.com",                 phone: "0787513866",     birthday: "2000-01-01", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-020", firstName: "Ineza",             lastName: "Lira Gabriella",     email: "ineza.lira.gabriella1@gmail.com",          phone: "0798836256",     birthday: "2000-10-25", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-021", firstName: "Lydia",             lastName: "Igisubizo",          email: "igisubizovanessa@gmail.com",              phone: "+250784321166",  birthday: "2000-04-21", classId: null, status: "active", notes: "Ghana" },
  { id: "st-022", firstName: "Béatrice",          lastName: "Kayirangwa",         email: "beatricekayirangwa@yahoo.com",            phone: "+32485318009",   birthday: "2000-05-01", classId: null, status: "active", notes: "Belgium" },
  { id: "st-023", firstName: "Emelyne",           lastName: "Umugwaneza Murara",  email: "emelyneumugwanezamurara@gmail.com",        phone: "0786874240",     birthday: "2000-03-20", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-024", firstName: "Kenthia",           lastName: "Iriza",              email: "Kenthiairiza@gmail.com",                  phone: "0465136718",     birthday: "2000-05-15", classId: null, status: "active", notes: "Luxembourg" },
  { id: "st-025", firstName: "Shina",             lastName: "Uwamungu",           email: "shinauwamungu@gmail.com",                 phone: "0798735739",     birthday: "2000-09-25", classId: null, status: "active", notes: "Ghana" },
  { id: "st-026", firstName: "Amelie",            lastName: "Akaliza Ndaruhutse", email: "akalizandaruhutseamelie@gmail.com",        phone: "+34601589126",   birthday: "2000-10-03", classId: null, status: "active", notes: "Barcelona, Spain" },
  { id: "st-027", firstName: "Bélinda",           lastName: "Simbi Rubango",      email: "belindasimbi2@gmail.com",                 phone: "5149683215",     birthday: "2000-08-14", classId: null, status: "active", notes: "Canada" },
  { id: "st-028", firstName: "Raissa",            lastName: "Cyuzuzo",            email: "cyuzuzoraissa@gmail.com",                 phone: "0609316827",     birthday: "2000-09-06", classId: null, status: "active", notes: "Morocco" },
  { id: "st-029", firstName: "Briseline",         lastName: "Chance",             email: "briseline.chance09@gmail.com",            phone: "+358413121511",  birthday: "2000-05-13", classId: null, status: "active", notes: "Finland (Myyrmäki)" },
  { id: "st-030", firstName: "René",              lastName: "Niringiyimana",      email: "niringiyi123rene@gmail.com",              phone: "+34647793537",   birthday: "2000-07-16", classId: null, status: "active", notes: "Spain" },
  { id: "st-031", firstName: "Elysee",            lastName: "Ntakirutimana",      email: "ntakirutimana10elysee@gmail.com",          phone: "0789137791",     birthday: "2000-06-10", classId: null, status: "active", notes: "Rwanda, Nyamata" },
  { id: "st-032", firstName: "Salima",            lastName: "Umutesi",            email: "salimamutesi223@gmail.com",               phone: "250783815700",   birthday: "2000-01-01", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-033", firstName: "Precious",          lastName: "Mutabazi",           email: "mutabazikprecious@gmail.com",             phone: "+25084755900",   birthday: "2000-11-26", classId: null, status: "active", notes: "Mozambique" },
  { id: "st-034", firstName: "Jean Jules Prince", lastName: "Iradukunda",         email: "iradukundajeanjulesprince06@gmail.com",   phone: "+250789644325",  birthday: "2000-12-25", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-035", firstName: "Ion",               lastName: "Blake",              email: "ionblake13@gmail.com",                    phone: "877057148",      birthday: "2000-09-09", classId: null, status: "active", notes: "Mozambique" },
  { id: "st-036", firstName: "Divine",            lastName: "Nikuze",             email: "divinenikuze@gmail.com",                  phone: "0788215448",     birthday: "2000-08-20", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-037", firstName: "Ineza",             lastName: "Divine",             email: "inezadivine506@gmail.com",                phone: "0616821162",     birthday: "2000-09-13", classId: null, status: "active", notes: "France" },
  { id: "st-038", firstName: "Shamy",             lastName: "Umukundwa",          email: "shamyumukundwaa@gmail.com",               phone: "0783233451",     birthday: "2000-05-11", classId: null, status: "active", notes: "Kenya" },
  { id: "st-039", firstName: "Bertrand",          lastName: "Hirwa",              email: "dusabebertrand841@gmail.com",             phone: "0791786146",     birthday: "2000-08-02", classId: null, status: "active", notes: "Rwanda/Kigali" },
  { id: "st-040", firstName: "Ange Divine",       lastName: "Ikirezi Kamariza",   email: "ikirezikamariza@gmail.com",               phone: "+34685915298",   birthday: "2000-01-31", classId: null, status: "active", notes: "Spain" },
  { id: "st-041", firstName: "Uwonkunda Keza",    lastName: "Roxane",             email: "",                                        phone: "0783543696",     birthday: "2000-06-09", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-042", firstName: "Walda",             lastName: "Uwase",              email: "uwasewalda2020@gmail.com",                phone: "+491782681094",  birthday: "2000-05-20", classId: null, status: "active", notes: "Germany" },
  { id: "st-043", firstName: "Marie Chantal",     lastName: "Abahuje",            email: "chantalaba06@gmail.com",                  phone: "624718732",      birthday: "2000-10-16", classId: null, status: "active", notes: "Spain" },
  { id: "st-044", firstName: "Yvette",            lastName: "Shema",              email: "Shemayvette12@gmail.com",                 phone: "+15027924847",   birthday: "2000-12-23", classId: null, status: "active", notes: "USA" },
  { id: "st-045", firstName: "Cyril Mwangi",      lastName: "Wahome",             email: "cyrimwangi@gmail.com",                    phone: "+34645486707",   birthday: "2000-05-01", classId: null, status: "active", notes: "Spain" },
  { id: "st-046", firstName: "Davina",            lastName: "Umurerwa",           email: "umurerwadavz23@gmail.com",                phone: "624281651",      birthday: "2000-04-02", classId: null, status: "active", notes: "Barcelona" },
  { id: "st-047", firstName: "Rispa Sabbat",      lastName: "Sangwa",             email: "rispasabbat13@gmail.com",                 phone: "+250739879548",  birthday: "2000-09-24", classId: null, status: "active", notes: "Spain" },
  { id: "st-048", firstName: "Jean Pierre",       lastName: "Ntigurirwa",         email: "ntigurirwajeanpierre28@gmail.com",         phone: "0788352248",     birthday: "2000-07-25", classId: null, status: "active", notes: "Rwanda/Kigali" },
  { id: "st-049", firstName: "Marie Belle",       lastName: "Ituze",              email: "Bellenelly10@gmail.com",                  phone: "32492719939",    birthday: "2000-01-03", classId: null, status: "active", notes: "Belgium" },
  { id: "st-050", firstName: "Onette",            lastName: "Enihakore",          email: "Onetteenihakore@gmail.com",               phone: "0977953353",     birthday: "2000-10-15", classId: null, status: "active", notes: "Zambia" },
  { id: "st-051", firstName: "Caleb",             lastName: "Mukiranutsi",        email: "godfreymanzi99@gmail.com",                phone: "0788334664",     birthday: "2000-04-02", classId: null, status: "active", notes: "Canada" },
  { id: "st-052", firstName: "Laura Brune",       lastName: "Iradukunda",         email: "iradukundalaurabrune12@gmail.com",         phone: "0796883976",     birthday: "2000-11-03", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-053", firstName: "Diane",             lastName: "Kamali",             email: "kanidy16@gmail.com",                      phone: "",               birthday: "2000-12-21", classId: null, status: "active", notes: "Germany" },
  { id: "st-054", firstName: "Alain",             lastName: "Nziza",              email: "nzizaalaingasasira@gmail.com",            phone: "250790110527",   birthday: "2000-05-31", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-055", firstName: "Mélissa",           lastName: "Niyikuza",           email: "melissaniyikuza6@gmail.com",              phone: "+25762699247",   birthday: "2000-10-05", classId: null, status: "active", notes: "Burundi" },
  { id: "st-056", firstName: "Estella Cooper",    lastName: "Rusaro",             email: "rusaro.c.estella@gmail.com",              phone: "0795186376",     birthday: "2000-02-18", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-057", firstName: "Jova",              lastName: "Umurerwa",           email: "jovaumurerwa@gmail.com",                  phone: "0795358479",     birthday: "2000-01-06", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-058", firstName: "Queen",             lastName: "Keza Sibomana",      email: "queenkeza54@gmail.com",                   phone: "0726182082",     birthday: "2000-03-05", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-059", firstName: "Ketia",             lastName: "Agasaro Kalisa",     email: "agasaroketia2007@gmail.com",              phone: "0785619168",     birthday: "2000-11-20", classId: null, status: "active", notes: "Rwanda" },
  { id: "st-060", firstName: "Lydia",             lastName: "Masasu",             email: "umulisalydiam@gmail.com",                 phone: "0727996959",     birthday: "2000-11-08", classId: null, status: "active", notes: "Rwanda" },
]

/* ── BUILDER ──────────────────────────────────────────────────────────────── */

export function buildSeed(): AppData {
  const data: AppData = {
    settings: { promotions: [{ id: "promo-default", name: "Promotion BCC Ghana 2026–2027", scheduleStartDate: "2026-09-04" }] },
    classes: baseClasses,
    lessons: baseLessons,
    students: baseStudents,
    events: [],
    meetings: [],
    todos: [],
  }
  data.events = generateSchedule(data)
  return data
}
