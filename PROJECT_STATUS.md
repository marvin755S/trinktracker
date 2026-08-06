# 🍻 Drink Tracker – Projektstatus

## Projektübersicht

Web-App zum gemeinsamen Verwalten und Auswerten von Getränken in Gruppen.

Technologien:

- Next.js (App Router)
- TypeScript
- Supabase
- Tailwind CSS

---

# Aktueller Stand

## Authentifizierung ✅

- Login
- Registrierung
- Logout
- Server-Side Auth
- Middleware eingerichtet
- Geschützte Seiten

---

## Admin-System ✅

Tabelle:

profiles

Spalten:

- id
- name
- approved
- is_admin

Funktionen:

- Benutzer sehen
- Benutzer freischalten
- Admins sehen alle Benutzer
- Nicht freigeschaltete Benutzer können Dashboard nicht benutzen

RLS eingerichtet.

---

## Gruppen ✅

Tabelle:

groups

Spalten:

- id
- name
- owner_id
- created_at

Erstellen einer Gruppe funktioniert.

Beim Erstellen:

1. Gruppe wird angelegt.
2. owner_id wird gesetzt.
3. Ersteller wird automatisch als owner in group_members eingetragen.

---

## Gruppenmitglieder ✅

Tabelle:

group_members

Spalten:

- group_id
- user_id
- role

role:

- owner
- member

RLS:

- User sieht eigene Mitgliedschaften.
- Owner kann Mitglieder hinzufügen.
- Owner kann Mitglieder entfernen.
- Owner kann Rollen ändern.

---

## Kategorien

Tabelle vorhanden.

Spalten:

- id
- group_id
- name

RLS eingerichtet.

CRUD noch nicht umgesetzt.

---

## Getränke

Tabelle vorhanden.

Spalten:

- id
- group_id
- user_id
- category_id
- amount
- created_at

RLS eingerichtet.

Frontend noch nicht umgesetzt.

---

# Datenbankstruktur

profiles

```
id (UUID)
name
approved
is_admin
```

groups

```
id
name
owner_id
created_at
```

group_members

```
group_id
user_id
role
```

categories

```
id
group_id
name
```

drinks

```
id
group_id
user_id
category_id
amount
created_at
```

---

# RLS

## profiles

- eigener Benutzer sichtbar
- Admin sieht alle
- Admin darf freigeben

## groups

INSERT

Owner muss auth.uid() sein.

SELECT

Owner oder Gruppenmitglied.

## group_members

SELECT

Eigene Mitgliedschaften.

INSERT

Owner darf Mitglieder hinzufügen.

UPDATE

Owner darf Rollen ändern.

DELETE

Owner darf Mitglieder entfernen.

## categories

Nur Mitglieder der Gruppe.

## drinks

Nur Mitglieder der Gruppe.

---

# Fertige Features

✅ Registrierung

✅ Login

✅ Adminbereich

✅ Benutzer freigeben

✅ Dashboard

✅ Gruppen erstellen

✅ Owner automatisch hinzufügen

✅ RLS vollständig eingerichtet

---

# Offene Features

## Gruppen

- Gruppenliste im Dashboard
- Gruppenseite
- Mitgliederliste
- Mitglieder entfernen
- Rollen ändern

---

## Einladungssystem

Idee:

groups

```
invite_code
```

User gibt Code ein.

Eintrag wird in group_members erstellt.

---

## Kategorien

- Kategorie erstellen
- Kategorie löschen
- Kategorie bearbeiten

---

## Getränke

- Getränk hinzufügen
- Getränk bearbeiten
- Getränk löschen

---

## Statistiken

- Gesamtverbrauch
- Verbrauch pro Benutzer
- Verbrauch pro Kategorie
- Monatsstatistik
- Rangliste

---

## UI

- Schöneres Dashboard
- Kartenlayout
- Mobile Optimierung
- Ladeanimationen
- Toast-Nachrichten

---

# Projektstruktur

app/

```
(auth)
dashboard
admin
```

components/

```
CreateGroup.tsx
```

lib/

```
group-actions.ts
supabase-server.ts
```

---

# Nächster sinnvoller Schritt

Dashboard fertig machen.

Dashboard soll:

- Eigene Gruppen anzeigen
- Neue Gruppe erstellen
- Gruppe auswählen

Danach:

/groups/[id]

mit

- Mitglieder
- Kategorien
- Getränke

---

# Bekannte Entscheidungen

- owner_id befindet sich in groups.
- owner wird zusätzlich in group_members gespeichert.
- Alle Daten werden über Supabase RLS abgesichert.
- Server Actions werden für Schreibzugriffe verwendet.
- App Router wird verwendet.

---

# Git Meilensteine

1. Login/Register
2. Admin-Freigabe
3. Gruppen + owner_id + RLS ✅

Nächster Commit:

Dashboard mit Gruppenübersicht