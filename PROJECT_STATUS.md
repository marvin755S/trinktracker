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

- id (uuid)
- name
- approved
- is_admin
- avatar_path

Funktionen:

- Benutzer sehen
- Benutzer freischalten
- Admins sehen alle Benutzer
- `is_admin()` RLS-Funktion vorhanden
- Nicht freigeschaltete Benutzer können Dashboard nicht benutzen

RLS eingerichtet.

---

## Gruppen ✅

Tabelle:

groups

Spalten:

- id (bigint)
- name
- owner_id
- created_at

Funktionen:

- Gruppe erstellen (Owner wird automatisch als member mit role=owner eingetragen)
- Gruppenliste im Dashboard
- Gruppenseite mit Leaderboard
- Gruppe löschen (nur Owner)
- Gruppe verlassen (nur Member, nicht Owner)

RLS:

- INSERT: Owner muss auth.uid() sein
- SELECT: Owner oder Gruppenmitglied
- DELETE: Nur Owner

---

## Gruppenmitglieder ✅

Tabelle:

group_members

Spalten:

- id (bigint PK)
- group_id
- user_id
- role
- joined_at

role:

- owner
- member

Constraint:

- UNIQUE (group_id, user_id) – kein doppeltes Mitglied möglich

Funktionen:

- Mitgliederliste anzeigen
- Mitglieder entfernen (nur Owner)
- Mitglieder einladen (nur Owner)
- Mitgliedschaft beitreten über Einladung

RLS eingerichtet.

---

## Einladungssystem ✅

Tabelle:

invitations

Spalten:

- id (uuid PK)
- group_id (bigint FK)
- invited_email (text, NOT NULL)
- invited_user_id (uuid)
- status (text, default 'pending')
- created_by (uuid)
- created_at (timestamptz)

Funktionen:

- Owner kann Mitglieder per Name suchen und einladen
- Eingeladener sieht eingehende Einladungen
- Einladung annehmen → landet als member in group_members
- Einladung ablehnen/zurückziehen
- Einladungen-Seite unter /invitations

RLS eingerichtet:

- SELECT: Ersteller, Eingeladener (user_id oder JWT-Email), Gruppen-Owner
- INSERT: created_by = auth.uid()
- DELETE: Ersteller, Eingeladener, Gruppen-Owner

---

## Kategorien ✅

Tabelle:

categories

Spalten:

- id (bigint)
- name
- user_id (uuid, nullable)
- created_at

Konzept:

- Default-Kategorien (user_id IS NULL): BIR, Äppler, Longdrink, Wein, Shot
- Persönliche Kategorien (user_id = auth.uid())

Funktionen:

- Kategorie erstellen
- Kategorie bearbeiten
- Kategorie löschen (mit Option: Getränke verschieben oder löschen)

RLS eingerichtet.

---

## Getränke ✅

Tabelle:

drinks

Spalten:

- id (bigint)
- amount (integer)
- category_id (bigint FK)
- event_id (bigint FK, nullable)
- user_id (uuid FK)
- created_at

Konzept:

- Getränke gehören einer Person, keiner Gruppe
- Ein persönliches Getränk zählt in allen Gruppen, in denen die Person Mitglied ist
- Optional kann ein Getränk einem Event zugeordnet werden

Funktionen:

- Getränk hinzufügen (persönlich oder mit Event)
- Getränke-Verlauf anzeigen (letzte 20)
- Getränk löschen

RLS eingerichtet.

---

## Events ✅

Tabelle:

events

Spalten:

- id (bigint)
- group_id (bigint FK)
- name
- created_at

Tabelle:

event_members

Spalten:

- event_id (bigint FK)
- user_id (uuid FK)

Konzept:

- Events sind optionale Gruppenkontexte (z. B. "Sommerurlaub 2026")
- Nur Gruppen-Owner können Events erstellen
- Event-Mitglieder müssen Gruppenmitglieder sein (Trigger)
- Drinks mit event_id zählen nur im Event-Leaderboard

Funktionen:

- Event erstellen (Owner)
- Event-Leaderboard
- Event-Seite unter /groups/[id]/events/[eventId]

Trigger:

- validate_event_member: Event-Mitglied muss in der Gruppe sein
- validate_drink_event: Getränk-Besitzer muss Event-Mitglied sein
- validate_drink_category: Kategorie muss Default oder eigene sein

RLS eingerichtet.

---

## Profil & Avatare ✅

Funktionen:

- Profilname ändern
- Avatar hochladen (Bucket: `avatars`, max. 2 MB, jpeg/png/webp)
- Avatar entfernen
- Avatar wird in Sidebar, Gruppen- und Events-Leaderboard angezeigt

Storage-RLS:

- User sieht nur eigene Avatare
- Gruppenmitglieder sehen Avatare ihrer Gruppenmitglieder

---

# Datenbankstruktur

profiles

```
id (uuid)
name (text)
approved (boolean)
is_admin (boolean)
avatar_path (text)
```

groups

```
id (bigint)
name (text)
owner_id (uuid)
created_at (timestamptz)
```

group_members

```
id (bigint PK)
group_id (bigint FK)
user_id (uuid FK)
role (text)
joined_at (timestamptz)
UNIQUE (group_id, user_id)
```

invitations

```
id (uuid PK)
group_id (bigint FK)
invited_email (text)
invited_user_id (uuid)
status (text)
created_by (uuid)
created_at (timestamptz)
```

categories

```
id (bigint PK)
name (text)
user_id (uuid, nullable für Default-Kategorien)
created_at (timestamptz)
```

drinks

```
id (bigint PK)
amount (integer)
category_id (bigint FK)
event_id (bigint, nullable, FK)
user_id (uuid FK)
created_at (timestamptz)
```

events

```
id (bigint PK)
group_id (bigint FK)
name (text)
created_at (timestamptz)
```

event_members

```
event_id (bigint FK)
user_id (uuid FK)
PK (event_id, user_id)
```

---

# RLS-Übersicht

## profiles

- Eigener Benutzer sichtbar
- Admin sieht alle
- "Profiles: authenticated select" – alle eingeloggten User
- Admin darf updaten (is_admin-Funktion)
- User kann eigenes Profil erstellen

## groups

- INSERT: auth.uid() = owner_id
- SELECT: owner_id = auth.uid() ODER is_group_member(id)
- DELETE: owner_id = auth.uid()

## group_members

- SELECT: Eigene Mitgliedschaften + Gruppenmitglieder
- INSERT: user_id = auth.uid() ODER Gruppen-Owner
- UPDATE: Gruppen-Owner
- DELETE: Gruppen-Owner
- UNIQUE (group_id, user_id)

## invitations

- SELECT: Ersteller, Eingeladener (user_id oder JWT-Email), Gruppen-Owner
- INSERT: created_by = auth.uid()
- UPDATE: Ersteller oder Gruppen-Owner
- DELETE: Ersteller, Eingeladener, Gruppen-Owner

## categories

- Eigene Kategorien (user_id = auth.uid())
- Default-Kategorien (user_id IS NULL)
- Gruppenmitglieder sehen Kategorien ihrer Gruppenmitglieder

## drinks

- Eigene Getränke
- Gruppenmitglieder sehen Getränke ihrer Gruppenmitglieder

## events

- Gruppenmitglieder sehen Events
- Nur Gruppen-Owner erstellen/updaten/löschen

## event_members

- Gruppenmitglieder sehen Event-Mitgliedschaften
- Nur Gruppen-Owner verwalten

---

# SQL-Funktionen

- `is_group_member(group_id bigint)` – prüft Gruppenmitgliedschaft
- `is_admin()` – prüft ob User Admin ist
- `validate_event_member()` – Trigger: Event-Mitglied muss Gruppenmitglied sein
- `validate_drink_event()` – Trigger: Getränk-Besitzer muss Event-Mitglied sein
- `validate_drink_category()` – Trigger: Kategorie muss Default oder eigene sein
- `update_own_profile_name(text)` – eigener Name ändern
- `update_own_avatar_path(text)` – eigener Avatar ändern

---

# Projektstruktur

app/

```
(auth)/
  login/
  register/
(protected)/
  layout.tsx
  admin/
  categories/
  dashboard/
  drinks/
  groups/[id]/
    drink-form.tsx
    event-form.tsx
    page.tsx
    events/[eventId]/page.tsx
  invitations/
  profile/
api/
  drinks/delete/
  groups/delete/
  groups/leave/
  groups/remove-member/
  user-email/
```

components/

```
sidebar.tsx
DrinkHistoryItem.tsx
DrinkHistoryList.tsx
GroupActions.tsx
InvitationActions.tsx
InvitationItem.tsx
InviteMembers.tsx
LeaderboardTable.tsx
LoadingOverlay.tsx
MemberList.tsx
```

> Hinweis: `InviteForm.tsx` ist veraltet (toter Code, wird nicht mehr importiert). Kann entfernt werden.

lib/

```
admin-actions.ts
drink-actions.ts
group-actions.ts
profile-actions.ts
supabase.ts
supabase-server.ts
```

supabase/

```
migrations/
diagnostics/
```

---

# Nächster sinnvoller Schritt

Die Datenbank ist konsolidiert (Fix-Migration `20260807120000_consolidated_fixes.sql`).

Mögliche nächste Features:

1. **Statistiken & Auswertungen**
   - Gesamtverbrauch
   - Verbrauch pro Benutzer
   - Verbrauch pro Kategorie
   - Monatsstatistik
   - Diagramme

2. **Event-Verwaltung erweitern**
   - Events bearbeiten/löschen (UI)
   - Event-Mitglieder verwalten (hinzufügen/entfernen)
   - Event-Beschreibung/Datum

3. **UI-Polish**
   - Mobile Optimierung
   - Dark Mode
   - Toast-Nachrichten statt alert()
   - Ladeanimationen

4. **Fehlerbehandlung & Tests**
   - Linting/TypeScript sauber
   - E2E-Tests

---

# Bekannte Entscheidungen

- owner_id befindet sich in groups.
- owner wird zusätzlich in group_members mit role="owner" gespeichert.
- Getränke gehören der Person, nicht der Gruppe.
- Alle Daten werden über Supabase RLS abgesichert.
- Server Actions werden für Schreibzugriffe verwendet.
- App Router wird verwendet.
- Einladungen können per User-ID (Name-Suche) und per Email erstellt werden.