# Diagram Sekwencji Autentykacji - AstroRunner

## Analiza Autentykacji

<authentication_analysis>

### 1. Przepływy autentykacji wymienione w plikach referencyjnych

**Z Auth Spec sekcja 3.3 - Authentication Flows:**

1. **Przepływ Rejestracji (Registration Flow):**
   - Użytkownik → /signup form → POST /api/auth/signup
   - Supabase tworzy auth.users entry
   - Serwer tworzy profiles entry
   - Session cookie ustawione
   - Przekierowanie do /activities

2. **Przepływ Logowania (Login Flow):**
   - Użytkownik → /login form → POST /api/auth/login
   - Supabase waliduje credentials
   - Session cookie ustawione
   - Przekierowanie do returnTo lub /activities

3. **Przepływ Wylogowania (Logout Flow):**
   - Użytkownik → UserMenu logout → POST /api/auth/logout
   - Supabase unieważnia sesję
   - Cookie wyczyszczone
   - Przekierowanie do /login

4. **Przepływ Resetowania Hasła (Password Reset Flow):**
   - Użytkownik → /password-reset → POST /api/auth/password-reset
   - Supabase wysyła email z tokenem
   - Użytkownik klika link → Strona Supabase
   - Użytkownik ustawia nowe hasło → Przekierowanie do /login

5. **Dostęp do Chronionej Strony (Protected Page Access):**
   - Request → Middleware → Weryfikacja sesji
   - Jeśli brak sesji → Przekierowanie /login
   - Jeśli sesja OK → Renderowanie strony

6. **Odświeżanie Tokenu (Session Refresh):**
   - Middleware sprawdza sesję przy każdym request
   - Próbuje odświeżyć jeśli access token wygasł
   - Przekierowuje do /login jeśli refresh fails
   - Transparentne dla użytkownika gdy sukces

### 2. Główni aktorzy i ich interakcje

**Aktorzy:**
1. **Przeglądarka (Browser)** - Interfejs użytkownika, wysyła requesty, renderuje strony
2. **Middleware Astro** - Pierwsza linia obrony, weryfikuje sesje, wstrzykuje kontekst
3. **Astro API Routes** - Endpointy backendowe (/api/auth/*, /api/profile, /api/activities)
4. **Supabase Auth** - Zewnętrzny serwis autentykacji, zarządza użytkownikami i sesjami
5. **PostgreSQL (Supabase)** - Baza danych z RLS, przechowuje profile i aktywności

**Interakcje:**

**Browser ↔ Middleware:**
- Browser wysyła każdy HTTP request
- Middleware interceptuje, sprawdza cookie sesji
- Middleware decyduje czy przepuścić, przekierować czy zablokować

**Middleware ↔ Supabase Auth:**
- Middleware tworzy klienta Supabase z SSR cookie handlers
- Middleware wywołuje supabase.auth.getUser() dla weryfikacji
- Middleware próbuje refreshSession() jeśli token wygasły

**Browser ↔ Astro API:**
- Browser wysyła POST requesty do /api/auth/* (signup, login, logout)
- API zwraca JSON responses (sukces/błąd)
- API ustawia HTTPOnly cookies (session)

**Astro API ↔ Supabase Auth:**
- API wywołuje supabase.auth.signUp() dla rejestracji
- API wywołuje supabase.auth.signInWithPassword() dla logowania
- API wywołuje supabase.auth.signOut() dla wylogowania
- API wywołuje supabase.auth.resetPasswordForEmail() dla reset hasła

**Astro API ↔ PostgreSQL:**
- API tworzy wpis w profiles po rejestracji
- API pobiera/aktualizuje profile dla /api/profile
- API pobiera/tworzy/aktualizuje activities dla /api/activities
- RLS automatycznie filtruje queries na podstawie auth.uid()

### 3. Procesy weryfikacji i odświeżania tokenów

**Weryfikacja Tokenu:**
1. Middleware odczytuje cookie sesji z każdego request
2. Wywołuje supabase.auth.getUser() z cookie
3. Supabase weryfikuje JWT signature i expiry
4. Jeśli ważny → zwraca user object
5. Jeśli nieważny → zwraca null

**Odświeżanie Tokenu:**
1. Access token lifetime: 1 godzina (default Supabase)
2. Refresh token lifetime: 7 dni (default Supabase)
3. Przy każdym request, middleware sprawdza czy access token wygasł
4. Jeśli wygasł ale refresh token ważny → supabase.auth.refreshSession()
5. Supabase generuje nowy access token
6. Nowe tokeny zapisane w cookie
7. Request kontynuowany z nową sesją
8. Użytkownik nie widzi żadnej zmiany (transparentne)

**Obsługa Wygaśnięcia:**
1. Jeśli refresh token też wygasł → refreshSession() fails
2. Middleware usuwa cookie
3. Middleware przekierowuje do /login?returnTo=current_path
4. Użytkownik musi zalogować się ponownie

**Bezpieczeństwo Tokenów:**
- Access token: JWT signed by Supabase secret
- Refresh token: opaque token, stored in Supabase DB
- Cookies: HTTPOnly (XSS protection), Secure (HTTPS only), SameSite=Lax (CSRF protection)
- Tokens nigdy nie są dostępne z JavaScript (HTTPOnly)

### 4. Opis każdego kroku autentykacji

**Krok 1: Rejestracja (Signup)**
1. Użytkownik wypełnia formularz rejestracji
2. Browser waliduje klientowo (format email, siła hasła)
3. Browser wysyła POST /api/auth/signup z {email, password}
4. API waliduje serwerowo (Zod schema)
5. API wywołuje supabase.auth.signUp({email, password})
6. Supabase hashuje hasło (bcrypt)
7. Supabase tworzy rekord w auth.users
8. Supabase generuje access + refresh tokens
9. Supabase zwraca session do API
10. API tworzy profil w profiles table (default distance_unit)
11. API ustawia HTTPOnly cookie z session
12. API zwraca 201 Created z {userId, email}
13. Browser otrzymuje response
14. Browser przekierowuje do /activities
15. Użytkownik zalogowany

**Krok 2: Logowanie (Login)**
1. Użytkownik wypełnia formularz logowania
2. Browser wysyła POST /api/auth/login z {email, password}
3. API waliduje input (Zod)
4. API wywołuje supabase.auth.signInWithPassword({email, password})
5. Supabase weryfikuje email (czy istnieje)
6. Supabase weryfikuje hasło (bcrypt compare)
7. Jeśli błędne → Supabase zwraca error
8. API zwraca 401 z generycznym "Invalid credentials" (security)
9. Jeśli poprawne → Supabase generuje tokens
10. Supabase zwraca session
11. API ustawia HTTPOnly cookie
12. API zwraca 200 OK z {userId, email}
13. Browser przekierowuje do /activities

**Krok 3: Dostęp do Chronionej Strony**
1. Browser wysyła GET /activities (z cookie)
2. Middleware interceptuje request
3. Middleware tworzy Supabase client z SSR cookie adapter
4. Middleware sprawdza czy path jest publiczny (/login, /signup, etc.)
5. Jeśli chroniony → Middleware wywołuje supabase.auth.getUser()
6. Supabase odczytuje JWT z cookie
7. Supabase weryfikuje signature i expiry
8. Jeśli access token wygasły → Middleware wywołuje refreshSession()
9. Jeśli refresh sukces → Nowe tokeny w cookie, kontynuuj
10. Jeśli brak sesji lub refresh fail → Middleware przekierowuje /login?returnTo=/activities
11. Jeśli sesja OK → Middleware wstrzykuje user do context.locals.user
12. Middleware przepuszcza request do page handler
13. Page handler pobiera dane (RLS filtruje automatycznie)
14. Page renderuje HTML
15. Browser otrzymuje i wyświetla stronę

**Krok 4: Wylogowanie (Logout)**
1. Użytkownik klika "Logout" w UserMenu
2. Browser wysyła POST /api/auth/logout
3. API wywołuje supabase.auth.signOut()
4. Supabase unieważnia refresh token w DB
5. Supabase zwraca sukces
6. API usuwa session cookie (set maxAge=0)
7. API zwraca 204 No Content
8. Browser otrzymuje response
9. Browser przekierowuje do /login
10. Użytkownik wylogowany

**Krok 5: Resetowanie Hasła**
1. Użytkownik wchodzi na /password-reset
2. Wprowadza email
3. Browser wysyła POST /api/auth/password-reset z {email}
4. API wywołuje supabase.auth.resetPasswordForEmail(email, {redirectTo: '...'})
5. Supabase sprawdza czy email istnieje
6. Jeśli istnieje → Supabase generuje jednorazowy token (1h lifetime)
7. Supabase wysyła email z linkiem zawierającym token
8. API ZAWSZE zwraca 202 Accepted (nie ujawnia czy email istnieje)
9. Browser wyświetla "Jeśli konto istnieje, otrzymasz email"
10. Użytkownik sprawdza pocztę
11. Użytkownik klika link → Otwiera się strona Supabase
12. Strona Supabase weryfikuje token
13. Jeśli wygasły → Błąd "Token expired"
14. Jeśli OK → Formularz ustawienia nowego hasła
15. Użytkownik wprowadza nowe hasło
16. Supabase hashuje i zapisuje
17. Supabase przekierowuje do /login
18. Użytkownik loguje się z nowym hasłem

**Krok 6: Odświeżanie Sesji (Automatic)**
1. Access token lifetime dobiega końca (po ~50 minutach)
2. Użytkownik wysyła request (np. GET /activities)
3. Middleware sprawdza sesję
4. Middleware wykrywa że access token wygasł
5. Middleware wywołuje supabase.auth.refreshSession()
6. Supabase sprawdza refresh token w cookie
7. Supabase weryfikuje refresh token w DB
8. Jeśli ważny → Supabase generuje nowy access token
9. Supabase zwraca nową sesję
10. Middleware aktualizuje cookie z nowymi tokenami
11. Request kontynuowany normalnie
12. Użytkownik nie zauważa niczego (transparentne)

</authentication_analysis>

## Diagram Mermaid

```mermaid
sequenceDiagram
    autonumber
    participant P as Przeglądarka
    participant M as Middleware
    participant API as Astro API
    participant SA as Supabase Auth
    participant DB as PostgreSQL

    Note over P,DB: PRZEPŁYW 1: REJESTRACJA NOWEGO UŻYTKOWNIKA

    P->>P: Wypełnienie formularza rejestracji
    P->>P: Walidacja kliencka
    P->>API: POST /api/auth/signup<br/>{email, password}
    activate API
    API->>API: Walidacja Zod schema
    API->>SA: auth.signUp(email, password)
    activate SA
    SA->>SA: Hash hasła bcrypt
    SA->>DB: INSERT INTO auth.users
    activate DB
    DB-->>SA: User utworzony
    deactivate DB
    SA->>SA: Generuj JWT access + refresh tokens
    SA-->>API: Session {access_token, refresh_token, user}
    deactivate SA
    API->>DB: INSERT INTO profiles<br/>{user_id, distance_unit: km}
    activate DB
    DB-->>API: Profil utworzony
    deactivate DB
    API->>API: Ustaw HTTPOnly cookie z session
    API-->>P: 201 Created<br/>{userId, email}
    deactivate API
    P->>P: Przekierowanie do /activities

    Note over P,DB: PRZEPŁYW 2: LOGOWANIE ISTNIEJĄCEGO UŻYTKOWNIKA

    P->>P: Wypełnienie formularza logowania
    P->>API: POST /api/auth/login<br/>{email, password}
    activate API
    API->>SA: auth.signInWithPassword
    activate SA
    SA->>DB: SELECT FROM auth.users WHERE email
    activate DB
    DB-->>SA: User data
    deactivate DB
    SA->>SA: Weryfikacja hasła bcrypt.compare

    alt Hasło niepoprawne
        SA-->>API: AuthError
        API-->>P: 401 Unauthorized<br/>Invalid credentials
        P->>P: Wyświetl błąd
    else Hasło poprawne
        SA->>SA: Generuj access + refresh tokens
        SA-->>API: Session {tokens, user}
        deactivate SA
        API->>API: Ustaw HTTPOnly cookie
        API-->>P: 200 OK {userId, email}
        deactivate API
        P->>P: Przekierowanie do /activities
    end

    Note over P,DB: PRZEPŁYW 3: DOSTĘP DO CHRONIONEJ STRONY

    P->>M: GET /activities (cookie w headerze)
    activate M
    M->>M: Utwórz Supabase client SSR
    M->>M: Sprawdź czy path publiczny

    alt Path publiczny
        M->>P: Przepuść request bez auth
    else Path chroniony
        M->>SA: auth.getUser() z cookie
        activate SA
        SA->>SA: Weryfikuj JWT signature + expiry

        alt Token access wygasły
            SA-->>M: Token expired
            M->>SA: auth.refreshSession()
            SA->>DB: Sprawdź refresh token
            activate DB
            DB-->>SA: Refresh token ważny
            deactivate DB
            SA->>SA: Generuj nowy access token
            SA-->>M: Nowa session
            M->>M: Aktualizuj cookie
            M->>M: Wstrzyknij user do context.locals
        else Token ważny
            SA-->>M: User object
            deactivate SA
            M->>M: Wstrzyknij user do context.locals
        else Brak sesji lub refresh failed
            M-->>P: 302 Redirect /login?returnTo=/activities
            P->>P: Wyświetl stronę logowania
        end

        M->>M: Przepuść request do page handler
        deactivate M
        Note over P: Page handler renderuje /activities
        P->>API: GET /api/activities
        activate API
        API->>DB: SELECT FROM activities<br/>WHERE user_id=auth.uid()
        activate DB
        Note right of DB: RLS automatycznie<br/>filtruje po user_id
        DB-->>API: Lista aktywności użytkownika
        deactivate DB
        API-->>P: 200 OK {items, totalCount}
        deactivate API
        P->>P: Renderuj listę aktywności
    end

    Note over P,DB: PRZEPŁYW 4: WYLOGOWANIE

    P->>P: Kliknięcie Logout w UserMenu
    P->>API: POST /api/auth/logout
    activate API
    API->>SA: auth.signOut()
    activate SA
    SA->>DB: DELETE refresh token z auth.sessions
    activate DB
    DB-->>SA: Token usunięty
    deactivate DB
    SA-->>API: Success
    deactivate SA
    API->>API: Wyczyść cookie sesji<br/>Set-Cookie maxAge=0
    API-->>P: 204 No Content
    deactivate API
    P->>P: Przekierowanie do /login

    Note over P,DB: PRZEPŁYW 5: RESETOWANIE HASŁA

    P->>P: Wypełnienie formularza reset hasła
    P->>API: POST /api/auth/password-reset<br/>{email}
    activate API
    API->>SA: auth.resetPasswordForEmail(email)
    activate SA
    SA->>DB: SELECT FROM auth.users WHERE email
    activate DB

    alt Email istnieje
        DB-->>SA: User found
        SA->>SA: Generuj jednorazowy token<br/>Ważność 1h
        SA->>SA: Wyślij email z linkiem reset
        Note right of SA: Link zawiera token<br/>i redirect URL
    else Email nie istnieje
        DB-->>SA: User not found
        Note right of SA: Nie wysyłaj emaila<br/>ale zwróć sukces
    end

    deactivate DB
    SA-->>API: Email sent (zawsze sukces)
    deactivate SA
    API-->>P: 202 Accepted<br/>Jeśli konto istnieje otrzymasz email
    deactivate API

    P->>P: Użytkownik sprawdza pocztę
    P->>SA: Kliknięcie linku w emailu<br/>GET /reset?token=xxx
    activate SA
    SA->>SA: Weryfikuj token

    alt Token ważny
        SA->>P: Formularz nowego hasła
        P->>P: Wprowadzenie nowego hasła
        P->>SA: POST nowe hasło
        SA->>SA: Hash nowego hasła
        SA->>DB: UPDATE auth.users SET password_hash
        activate DB
        DB-->>SA: Hasło zaktualizowane
        deactivate DB
        SA->>SA: Unieważnij token reset
        SA-->>P: 302 Redirect /login
        deactivate SA
        P->>P: Komunikat Hasło zmienione
    else Token wygasły lub nieprawidłowy
        SA-->>P: 400 Token expired or invalid
        deactivate SA
        P->>P: Wyświetl błąd i link do /password-reset
    end

    Note over P,DB: PRZEPŁYW 6: AUTOMATYCZNE ODŚWIEŻANIE SESJI

    Note over P: Access token zbliża się do wygaśnięcia<br/>Użytkownik wysyła request
    P->>M: GET /profile (cookie z wygasłym access token)
    activate M
    M->>SA: auth.getUser()
    activate SA
    SA->>SA: Sprawdź access token JWT

    alt Access token wygasły
        SA-->>M: Token expired error
        M->>SA: auth.refreshSession()
        SA->>DB: Sprawdź refresh token w sessions
        activate DB

        alt Refresh token ważny
            DB-->>SA: Refresh token OK
            deactivate DB
            SA->>SA: Generuj nowy access token
            SA->>SA: Opcjonalnie rotuj refresh token
            SA-->>M: Nowa session {access, refresh, user}
            M->>M: Aktualizuj HTTPOnly cookie
            M->>M: Wstrzyknij user do context
            M->>M: Kontynuuj request normalnie
            deactivate M
            Note over P: Użytkownik nie zauważa niczego<br/>Request zakończony sukcesem
        else Refresh token wygasły lub nieprawidłowy
            DB-->>SA: Refresh token invalid
            deactivate DB
            SA-->>M: Auth error
            deactivate SA
            M->>M: Wyczyść cookie
            M-->>P: 302 Redirect /login?returnTo=/profile
            deactivate M
            P->>P: Użytkownik musi się zalogować ponownie
        end
    else Access token ważny
        SA-->>M: User object
        deactivate SA
        M->>M: Kontynuuj normalnie
        deactivate M
    end

    Note over P,DB: BEZPIECZEŃSTWO: ROW LEVEL SECURITY

    Note over DB: Każdy SELECT/INSERT/UPDATE/DELETE<br/>automatycznie filtrowany przez RLS
    Note over DB: Polityka: user_id = auth.uid()<br/>Użytkownik widzi tylko swoje dane
    Note over SA: JWT zawiera user_id claim<br/>PostgreSQL ekstraktuje auth.uid()
```

## Opis Bezpieczeństwa Autentykacji

### Kluczowe Mechanizmy Bezpieczeństwa

#### 1. Zarządzanie Tokenami

**Access Token (JWT):**
- Czas życia: 1 godzina (default Supabase)
- Format: JSON Web Token signed by Supabase secret
- Claims: user_id, email, role, exp (expiry), iat (issued at)
- Przechowywanie: HTTPOnly cookie (niedostępny z JavaScript)
- Weryfikacja: Przy każdym request przez middleware lub API

**Refresh Token:**
- Czas życia: 7 dni (default Supabase, configurable)
- Format: Opaque token (random string)
- Przechowywanie: HTTPOnly cookie + Supabase DB (auth.sessions)
- Użycie: Tylko do generowania nowych access tokens
- Rotacja: Opcjonalnie nowy refresh token przy każdym refresh

**Cykl życia sesji:**
1. Login/Signup → Generacja access + refresh tokens
2. Request co 5-50 minut → Access token ważny, użyj go
3. Po ~55 minutach → Access token wygasł, użyj refresh token
4. Middleware/API automatycznie odświeża → Nowy access token
5. Po 7 dniach → Refresh token wygasł, wymaga ponownego logowania
6. Logout → Oba tokeny unieważnione

#### 2. HTTPOnly Cookies

**Atrybuty cookie:**
```
Set-Cookie: sb-access-token=xxx;
  HttpOnly;
  Secure;
  SameSite=Lax;
  Path=/;
  Max-Age=3600
```

**HttpOnly:** Zapobiega dostępowi z JavaScript (ochrona XSS)
**Secure:** Tylko HTTPS (produkcja)
**SameSite=Lax:** Ochrona CSRF
**Path=/:** Dostępne dla całej aplikacji
**Max-Age:** Automatyczne wygaśnięcie

#### 3. Row Level Security (RLS)

**Jak działa:**
1. Użytkownik loguje się → JWT zawiera `user_id` claim
2. Request do PostgreSQL → JWT przekazywany w connection string
3. PostgreSQL ekstraktuje `auth.uid()` z JWT
4. RLS policy automatycznie filtruje: `WHERE user_id = auth.uid()`
5. Użytkownik widzi tylko swoje dane

**Przykładowe polityki:**
```sql
-- Profiles table
CREATE POLICY "own_profile_select" ON profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Activities table
CREATE POLICY "own_activities_select" ON activities
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

**Obrona w głąb:**
- Nawet jeśli aplikacja ma bug, RLS chroni dane
- Nie można pominąć RLS z poziomu aplikacji (tylko service role key)
- Service role key NIGDY nie jest używany w produkcji

#### 4. Zapobieganie User Enumeration

**Logowanie:**
- ❌ Błąd: "User not found" → Ujawnia że email nie istnieje
- ✅ Poprawnie: "Invalid credentials" → Generyczny komunikat

**Resetowanie hasła:**
- ❌ Błąd: "Email doesn't exist" → Ujawnia czy konto istnieje
- ✅ Poprawnie: "If account exists, email sent" → Zawsze ten sam komunikat

**Rejestracja:**
- ❌ Błąd: "Email already used" tylko przy próbie signup
- ✅ Nie można sprawdzić czy email istnieje bez próby rejestracji

#### 5. Rate Limiting

**Domyślne limity (do wdrożenia):**
- Login: 5 prób/minutę na IP
- Signup: 3 rejestracje/godzinę na IP
- Password reset: 3 requesty/godzinę na email
- API requests: 60 requestów/minutę na użytkownika

**Implementacja:** Supabase GoTrue + opcjonalnie middleware

#### 6. Walidacja Wielowarstwowa

**Warstwa 1: Klient (React):**
- Walidacja formatu email
- Sprawdzenie siły hasła (real-time feedback)
- Walidacja zgodności haseł
- Cel: UX, natychmiastowy feedback

**Warstwa 2: API (Astro):**
- Zod schema validation
- Weryfikacja Content-Type
- Sanityzacja inputów
- Cel: Bezpieczeństwo, nigdy nie ufaj klientowi

**Warstwa 3: Baza danych:**
- CHECK constraints
- UNIQUE constraints
- NOT NULL constraints
- Cel: Integralność danych

#### 7. HTTPS Enforcement

**Produkcja:**
- Wszystkie requesty przez HTTPS
- HTTP automatycznie przekierowywane do HTTPS
- HSTS header: `Strict-Transport-Security: max-age=31536000`
- Secure cookie flag włączony

**Development:**
- Localhost może używać HTTP
- Secure flag wyłączony w dev

### Scenariusze Zagrożeń i Ochrona

#### Zagrożenie 1: XSS (Cross-Site Scripting)
**Atak:** Wstrzyknięcie złośliwego JavaScript do strony
**Ochrona:**
- HTTPOnly cookies → JS nie ma dostępu do tokenów
- React automatycznie escapuje output
- Content Security Policy headers
- Brak `dangerouslySetInnerHTML`

#### Zagrożenie 2: CSRF (Cross-Site Request Forgery)
**Atak:** Nieuprawniony request z innej domeny
**Ochrona:**
- SameSite=Lax cookies → Requesty z innych domen nie zawierają cookie
- State verification w formularzach
- Origin header validation

#### Zagrożenie 3: SQL Injection
**Atak:** Wstrzyknięcie SQL do queries
**Ochrona:**
- Supabase używa parameterized queries
- Brak raw SQL w aplikacji
- RLS dodatkowa warstwa ochrony

#### Zagrożenie 4: Session Hijacking
**Atak:** Kradzież session cookie
**Ochrona:**
- HTTPOnly → Cookie nie dostępne z JS
- Secure → Cookie tylko przez HTTPS
- Short-lived access tokens (1h)
- Refresh token rotation

#### Zagrożenie 5: Brute Force
**Atak:** Masowe próby logowania
**Ochrona:**
- Rate limiting (5 prób/minutę)
- Exponential backoff
- CAPTCHA po X nieudanych prób (future)
- Account lockout po Y prób (optional)

### Compliance

**GDPR/RODO:**
- Minimalizacja danych (tylko email + hasło)
- Secure password hashing (bcrypt)
- User can delete account (cascade delete)
- No tracking cookies
- HTTPS enforcement
- Right to access data (API endpoints)
- Right to be forgotten (delete endpoint)

**OWASP Top 10:**
- ✅ A01: Broken Access Control → RLS
- ✅ A02: Cryptographic Failures → HTTPS, bcrypt
- ✅ A03: Injection → Parameterized queries
- ✅ A05: Security Misconfiguration → Secure defaults
- ✅ A07: Identification/Auth Failures → Supabase Auth best practices
