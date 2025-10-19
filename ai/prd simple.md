# Dokument wymagań produktu (PRD) – Activity Logger

## 1. Przegląd produktu
Activity Logger to minimalistyczna aplikacja internetowa zaprojektowana w celu uproszczenia śledzenia i historycznego przeglądania osobistych aktywności biegowych i spacerowych. Celem jest zapewnienie prostego interfejsu **CRUD** (Tworzenie, Odczyt, Aktualizacja, Usuwanie) dla danych aktywności, co ma rozwiązać problem uciążliwego ręcznego śledzenia i utraty historycznych danych o postępach.

---

## 2. Problem użytkownika
Ręczne śledzenie biegów i spacerów jest uciążliwe i zajmuje czas.<br> Po pewnym czasie użytkownikowi trudno jest przypomnieć sobie, ile razy biegał/spacerował w danym miesiącu lub roku.<br> Użytkownicy potrzebują prostego, szybkiego i dostępnego systemu do rejestrowania aktywności i przeglądania historii.

---

## 3. Wymagania funkcjonalne

### 3.1. Wymagania Fazy 1 (MVP)

1.  **Rejestracja i uwierzytelnianie:**
    * **FR-001:** Rejestracja nowego użytkownika za pomocą unikalnego e-maila/nazwy użytkownika i bezpiecznego hasła.
    * **FR-002:** Logowanie istniejącego użytkownika.
    * **FR-003:** Mechanizm bezpiecznego resetowania hasła.

2.  **Zarządzanie danymi aktywności (CRUD):**
    * **FR-004:** Tworzenie (Dodawanie) nowego wpisu aktywności przez zalogowanego użytkownika.
    * **FR-005:** Wymagane pola dla wpisu: **Data**, **Czas trwania**, **Typ Aktywności** (Bieg/Spacer/Mieszana). **Dystans jest opcjonalny**.
    * **FR-006:** Przeglądanie aktywności w **prostej liście** z widocznymi wszystkimi polami danych.
    * **FR-007:** Aktualizacja (Edycja) wszystkich pól istniejącego wpisu.
    * **FR-008:** Usuwanie istniejącego wpisu aktywności.
    * **FR-009:** Musi być wyświetlony **dialog potwierdzenia** przed trwałym usunięciem wpisu.

### 3.2. Wymagania Odroczone (Faza 2)

1.  **Widok Kalendarza (FR-010):** Siatka miesięczna z podświetleniem (kolor zielony) dni, w których wystąpiła co najmniej jedna aktywność.

2.  **Strona Statystyk (FR-011):** Dedykowana strona z zagregowanymi statystykami (np. Całkowity Czas Trwania Biegów, Całkowity Dystans Spacerów) dla wybranego okresu.

3.  **Obsługa Dystansu (FR-012):** Wpisy bez pola Dystans muszą być **wykluczone** z obliczeń statystyk "Całkowity Dystans".

---

## 4. Granice produktu

### 4.1. W zakresie MVP

* Dostęp tylko przez **aplikację internetową (web)**.<br>
* Podstawowy system konta użytkownika (**Logowanie, Rejestracja, Reset hasła**).<br>
* Główna funkcjonalność CRUD dla danych aktywności.<br>
* Projektowanie w podejściu **mobile-first** i **minimalistyczne**.<br>
* Wymagania bezpieczeństwa i prawne: Zgodność z **RODO (GDPR)**, co oznacza m.in. **bezpieczne haszowanie haseł** i wymóg **HTTPS**.

### 4.2. Poza zakresem MVP

* Aplikacje mobilne i na zegarki (watch app).<br>
* Udostępnianie danych między użytkownikami.<br>
* Złożona analiza danych (np. trendy, obliczenia tempa).<br>
* Funkcjonalność eksportu danych (np. CSV, JSON).<br>
* Weryfikacja konta e-mail (odłożona jako Dług Techniczny).<br>
* Widok Kalendarza (odroczony).<br>
* Dedykowana Strona Statystyk (odroczona).

---

## 5. Historyjki użytkowników

1.  **ID: US-001**
    * *Tytuł:* Rejestracja nowego użytkownika
    * *Opis:* Jako nowy użytkownik chcę się szybko zarejestrować i zalogować, aby natychmiast rozpocząć śledzenie moich aktywności.<br>
    * *Kryteria akceptacji:*
        * Użytkownik podaje unikalny e-mail/nazwę i hasło.<br>
        * Hasło jest **bezpiecznie haszowane i przechowywane**.<br>
        * Po pomyślnej rejestracji użytkownik jest zalogowany i przekierowany do widoku dodawania aktywności.

2.  **ID: US-002**
    * *Tytuł:* Bezpieczne Logowanie
    * *Opis:* Jako zarejestrowany użytkownik chcę się zalogować bezpiecznie, aby uzyskać dostęp do moich prywatnych danych aktywności.<br>
    * *Kryteria akceptacji:*
        * Po podaniu poprawnych danych następuje pomyślne uwierzytelnienie i ustanowienie sesji.<br>
        * **HTTPS** musi być wymuszone dla wszystkich transakcji logowania.<br>
        * Błędne dane logowania wyświetlają ogólny komunikat o błędzie.

3.  **ID: US-003**
    * *Tytuł:* Resetowanie hasła
    * *Opis:* Jako użytkownik, który zapomniał hasła, chcę zainicjować proces resetowania, aby odzyskać dostęp do mojego konta.<br>
    * *Kryteria akceptacji:*
        * Użytkownik może zainicjować reset hasła na stronie logowania.<br>
        * System umożliwia ustawienie **nowego, bezpiecznego hasła**.

4.  **ID: US-004**
    * *Tytuł:* Dodanie nowej aktywności (pełne dane)
    * *Opis:* Jako użytkownik chcę szybko dodać nowy wpis z kompletnymi szczegółami (w tym Dystans), aby mieć pełny zapis mojego treningu.<br>
    * *Kryteria akceptacji:*
        * Użytkownik może przesłać formularz z **Datą, Czasem Trwania, Typem Aktywności i Dystansem**.<br>
        * Wszystkie pola obowiązkowe muszą być wypełnione, by formularz został zaakceptowany.<br>
        * Nowy wpis pojawia się na górze listy aktywności.

5.  **ID: US-005**
    * *Tytuł:* Dodanie nowej aktywności (bez dystansu)
    * *Opis:* Jako użytkownik, chcę móc dodać aktywność, nawet jeśli nie znam dokładnego dystansu, aby zachować ciągłość śledzenia.<br>
    * *Kryteria akceptacji:*
        * Użytkownik może pomyślnie przesłać formularz *bez* wypełniania opcjonalnego pola Dystans.<br>
        * Zapisany wpis w widoku listy poprawnie odzwierciedla brak danych dystansu (jako puste/zero).

6.  **ID: US-006**
    * *Tytuł:* Przeglądanie listy aktywności
    * *Opis:* Jako użytkownik chcę widzieć prostą listę wszystkich moich aktywności, aby móc szybko sprawdzić lub poprawić wpisy.<br>
    * *Kryteria akceptacji:*
        * System wyświetla wszystkie aktywności w kolejności chronologicznej (najnowsze na górze).<br>
        * Każdy wpis wyświetla **Datę, Czas Trwania, Typ Aktywności, i Dystans** (jeśli jest).<br>
        * Każdy wpis musi mieć wyraźne przyciski/linki do "Edytuj" i "Usuń".

7.  **ID: US-007**
    * *Tytuł:* Edycja istniejącej aktywności
    * *Opis:* Jako użytkownik chcę zmodyfikować istniejący wpis, aby skorygować błędy lub dodać zapomniany dystans.<br>
    * *Kryteria akceptacji:*
        * Kliknięcie "Edytuj" wczytuje dane wpisu do edytowalnego formularza.<br>
        * Użytkownik może zmienić dowolne pole (Data, Czas, Typ, Dystans).<br>
        * Po zapisaniu lista aktywności jest aktualizowana.

8.  **ID: US-008**
    * *Tytuł:* Usuwanie aktywności
    * *Opis:* Jako użytkownik chcę trwale usunąć niepoprawnie dodany lub niepotrzebny wpis.<br>
    * *Kryteria akceptacji:*
        * Kliknięcie "Usuń" wyzwala **dialog potwierdzenia** ("Czy na pewno chcesz usunąć tę aktywność?").<br>
        * Potwierdzenie trwale usuwa wpis z systemu.<br>
        * Anulowanie zachowuje wpis bez zmian.

9.  **ID: US-009**
    * *Tytuł:* Bezpieczny dostęp i autoryzacja
    * *Opis:* Jako zalogowany użytkownik chcę mieć pewność, że moje dane są dostępne tylko dla mnie, aby zachować prywatność i bezpieczeństwo.<br>
    * *Kryteria akceptacji:*
        * Tylko zalogowany użytkownik może wyświetlać, edytować i usuwać swoje aktywności.<br>
        * System musi uniemożliwić dostęp do danych innych użytkowników.

---

## 6. Metryki sukcesu

### 6.1. Faza 1 (MVP) Sukces

1.  **Zakończenie Pętli Głównej:**
    * *Opis:* Użytkownik pomyślnie się loguje, dodaje co najmniej jedną aktywność i przegląda ją na liście.<br>
    * *Cel:* **100%** uruchomionych użytkowników jest w stanie ukończyć tę pętlę.

2.  **Współczynnik Sukcesu Dodania Aktywności:**
    * *Opis:* Odsetek pomyślnych przesłań formularza "Dodaj nową aktywność".<br>
    * *Cel:* $\ge 99\%$ średnio po uruchomieniu.

3.  **Częstotliwość Aktywności Użytkownika:**
    * *Opis:* Średnia liczba aktywności logowanych przez aktywnego użytkownika tygodniowo (miernik zaangażowania).<br>
    * *Cel:* $\ge 3$ aktywności tygodniowo.

### 6.2. Metryki Bezpieczeństwa i Zgodności

1.  **HTTPS Enforcement**
    * *Opis:* Cały ruch do aplikacji musi odbywać się za pośrednictwem protokołu HTTPS.<br>
    * *Cel:* $100\%$

2.  **Zgodność z RODO/GDPR**
    * *Opis:* Przechowywanie i obsługa danych użytkownika spełnia określone normy bezpieczeństwa i prywatności.<br>
    * *Cel:* $100\%$ Zgodności.