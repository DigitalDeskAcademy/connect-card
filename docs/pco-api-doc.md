# Planning Center People API: Developer Reference Guide

**Direct API integration replaces manual CSV imports** for syncing visitor data from your church connect card application to Planning Center. This guide provides everything needed to implement a "Sync to Planning Center" feature in your Next.js/TypeScript application—authentication setup, complete endpoint documentation, TypeScript interfaces, and production-ready code examples.

The Planning Center People API uses the **JSON:API 1.0 specification** with OAuth 2.0 authentication for multi-tenant applications. People (the contact management product) is completely free for unlimited profiles, and API access carries no additional cost. Your application will create persons, attach contact information through related endpoints, and use email-based duplicate detection before syncing.

---

## Quick start: Your first API call in 5 minutes

### Step 1: Create a Personal Access Token

1. Sign up at [planningcenter.com](https://www.planningcenter.com) (free)
2. Navigate to [api.planningcenteronline.com/oauth/applications](https://api.planningcenteronline.com/oauth/applications)
3. Click "Create Personal Access Token"
4. Name it (e.g., "Visitor Sync Development")
5. Select the `people` scope
6. Save both the **Application ID** and **Secret**

### Step 2: Make your first request

```bash
curl -u YOUR_APPLICATION_ID:YOUR_SECRET \
  "https://api.planningcenteronline.com/people/v2/people?per_page=5"
```

### Step 3: Verify the response

```json
{
  "data": [
    {
      "type": "Person",
      "id": "12345",
      "attributes": {
        "first_name": "John",
        "last_name": "Doe",
        "status": "active"
      }
    }
  ],
  "meta": { "total_count": 150 }
}
```

---

## Authentication

Planning Center supports two authentication methods: **Personal Access Tokens** for single-organization development and **OAuth 2.0** for multi-tenant production applications serving multiple churches.

### Personal Access Tokens (development)

PATs use HTTP Basic Authentication—ideal for development, internal tools, and single-church deployments. The token pair never expires but grants access only to the creating user's organization.

**Header format:**

```
Authorization: Basic {base64(application_id:secret)}
```

**TypeScript implementation:**

```typescript
const credentials = Buffer.from(`${appId}:${secret}`).toString("base64");

const response = await fetch(
  "https://api.planningcenteronline.com/people/v2/people",
  {
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  }
);
```

### OAuth 2.0 Authorization Code flow (production)

For multi-tenant applications where each church connects their own Planning Center account, implement the OAuth 2.0 Authorization Code flow.

**Step 1: Register your OAuth application**

Navigate to [api.planningcenteronline.com/oauth/applications](https://api.planningcenteronline.com/oauth/applications) and register with:

- Application name
- Website URL
- Redirect URI(s): `https://yourapp.com/auth/callback`

**Step 2: Redirect users to authorize**

```typescript
const authUrl = new URL("https://api.planningcenteronline.com/oauth/authorize");
authUrl.searchParams.set("client_id", process.env.PCO_CLIENT_ID);
authUrl.searchParams.set("redirect_uri", process.env.PCO_REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", "people");

// Redirect user to authUrl.toString()
```

**Step 3: Exchange authorization code for tokens**

```typescript
const tokenResponse = await fetch(
  "https://api.planningcenteronline.com/oauth/token",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: authorizationCode,
      client_id: process.env.PCO_CLIENT_ID,
      client_secret: process.env.PCO_CLIENT_SECRET,
      redirect_uri: process.env.PCO_REDIRECT_URI,
    }),
  }
);

const { access_token, refresh_token, expires_in } = await tokenResponse.json();
// expires_in is typically 7200 seconds (2 hours)
```

**Step 4: Refresh expired tokens**

Access tokens expire after **2 hours**. Refresh proactively before expiration:

```typescript
async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  const response = await fetch(
    "https://api.planningcenteronline.com/oauth/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.PCO_CLIENT_ID,
        client_secret: process.env.PCO_CLIENT_SECRET,
      }),
    }
  );
  return response.json();
}
```

### Required scopes for contact management

| Scope    | Access granted                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| `people` | Full access to People product: persons, emails, phones, addresses, households, custom fields, notes, lists, workflows |

For visitor management, `people` is the only scope needed. Request additional scopes (`check_ins`, `groups`) only if integrating with those products.

---

## API reference

**Base URL:** `https://api.planningcenteronline.com/people/v2/`

**Required headers for all requests:**

```
Authorization: Bearer {access_token}  OR  Basic {base64_credentials}
Content-Type: application/json
Accept: application/json
```

### People endpoints

#### List and search people

```
GET /people/v2/people
```

| Parameter                     | Example                          | Description                                       |
| ----------------------------- | -------------------------------- | ------------------------------------------------- |
| `per_page`                    | `100`                            | Results per page (max 100)                        |
| `offset`                      | `100`                            | Skip N records for pagination                     |
| `order`                       | `-created_at`                    | Sort field (prefix `-` for descending)            |
| `where[search_name_or_email]` | `john@email.com`                 | **Duplicate detection** - search by name or email |
| `where[last_name]`            | `Smith`                          | Filter by exact last name                         |
| `include`                     | `emails,phone_numbers,addresses` | Sideload related resources                        |

**Duplicate detection example:**

```typescript
// Before creating a visitor, check if they already exist
const searchResponse = await pcoClient.get("/people/v2/people", {
  params: {
    "where[search_name_or_email]": visitor.email,
    include: "emails",
  },
});

const existingPerson = searchResponse.data.data[0];
if (existingPerson) {
  // Update existing person instead of creating duplicate
  return updatePerson(existingPerson.id, visitor);
}
```

#### Create a person

```
POST /people/v2/people
```

```typescript
const createPersonPayload = {
  data: {
    type: "Person",
    attributes: {
      first_name: "Jane",
      last_name: "Smith",
      gender: "female",
      membership: "Visitor", // Custom membership status
      child: false,
      primary_campus_id: "12345", // Multi-site assignment
    },
  },
};
```

**Response:**

```json
{
  "data": {
    "type": "Person",
    "id": "98765",
    "attributes": {
      "first_name": "Jane",
      "last_name": "Smith",
      "name": "Jane Smith",
      "created_at": "2026-01-01T10:30:00Z",
      "status": "active"
    }
  }
}
```

#### Get a single person

```
GET /people/v2/people/{person_id}?include=emails,phone_numbers,addresses,primary_campus
```

#### Update a person

```
PATCH /people/v2/people/{person_id}
```

Only include fields you want to change—partial updates are supported:

```typescript
const updatePayload = {
  data: {
    type: "Person",
    id: "98765",
    attributes: {
      membership: "Member",
      primary_campus_id: "67890",
    },
  },
};
```

### Emails endpoints

Contact information is managed through **separate related endpoints**, not the Person attributes.

```
GET    /people/v2/people/{person_id}/emails
POST   /people/v2/people/{person_id}/emails
PATCH  /people/v2/emails/{email_id}
DELETE /people/v2/emails/{email_id}
```

**Create email:**

```typescript
const emailPayload = {
  data: {
    type: "Email",
    attributes: {
      address: "jane.smith@example.com",
      location: "Home", // "Home", "Work", "Other"
      primary: true,
    },
  },
};

await pcoClient.post(`/people/v2/people/${personId}/emails`, emailPayload);
```

### Phone numbers endpoints

```
GET    /people/v2/people/{person_id}/phone_numbers
POST   /people/v2/people/{person_id}/phone_numbers
PATCH  /people/v2/phone_numbers/{phone_id}
DELETE /people/v2/phone_numbers/{phone_id}
```

**Create phone number:**

```typescript
const phonePayload = {
  data: {
    type: "PhoneNumber",
    attributes: {
      number: "555-123-4567",
      location: "Mobile", // "Mobile", "Home", "Work", "Pager", "Fax", "Skype", "Other"
      primary: true,
    },
  },
};
```

### Addresses endpoints

```
GET    /people/v2/people/{person_id}/addresses
POST   /people/v2/people/{person_id}/addresses
PATCH  /people/v2/addresses/{address_id}
DELETE /people/v2/addresses/{address_id}
```

**Create address:**

```typescript
const addressPayload = {
  data: {
    type: "Address",
    attributes: {
      street: "123 Main Street",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      location: "Home",
      primary: true,
    },
  },
};
```

### Campus endpoints (multi-site support)

```
GET /people/v2/campuses                    // List all campuses
GET /people/v2/people/{person_id}/primary_campus
```

Assign campus during person creation/update via `primary_campus_id` attribute.

### Custom fields endpoints

Custom fields store additional data like "How did you hear about us?" or volunteer interests.

```
GET  /people/v2/field_definitions                      // List all custom field definitions
GET  /people/v2/people/{person_id}/field_data          // Get person's custom field values
POST /people/v2/people/{person_id}/field_data          // Set custom field value
```

**Set custom field value:**

```typescript
const fieldDataPayload = {
  data: {
    type: "FieldDatum",
    attributes: {
      value: "Church Website",
      field_definition_id: "456", // ID of "How did you hear about us?" field
    },
  },
};
```

---

## Data models with TypeScript interfaces

```typescript
// ============================================
// Core Resource Types
// ============================================

interface Person {
  id: string;
  type: "Person";
  attributes: PersonAttributes;
  relationships?: PersonRelationships;
  links: { self: string };
}

interface PersonAttributes {
  // Writable fields
  first_name: string;
  last_name: string;
  given_name?: string; // Legal/formal first name
  nickname?: string | null;
  middle_name?: string | null;
  birthdate?: string | null; // "YYYY-MM-DD"
  anniversary?: string | null; // "YYYY-MM-DD"
  gender?: string | null; // "male", "female", or custom
  grade?: number | null; // School grade -1 to 12
  child?: boolean;
  graduation_year?: number | null;
  membership?: string | null; // Membership status (custom)
  status?: "active" | "inactive";
  medical_notes?: string | null;
  avatar?: string | null; // URL or base64
  remote_id?: number | null; // External system ID (your app's ID)

  // Write-only (use in POST/PATCH, not returned in response)
  primary_campus_id?: string;
  gender_id?: string;

  // Read-only fields
  name: string; // Computed full name
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  directory_status?: string;
  passed_background_check?: boolean;
}

interface PersonRelationships {
  primary_campus?: { data: { type: "Campus"; id: string } | null };
  emails?: { data: ResourceIdentifier[] };
  phone_numbers?: { data: ResourceIdentifier[] };
  addresses?: { data: ResourceIdentifier[] };
  households?: { data: ResourceIdentifier[] };
}

// ============================================
// Contact Information Types
// ============================================

interface Email {
  id: string;
  type: "Email";
  attributes: {
    address: string;
    location: "Home" | "Work" | "Other" | string;
    primary: boolean;
    blocked?: boolean; // Read-only
    created_at: string;
    updated_at: string;
  };
}

interface PhoneNumber {
  id: string;
  type: "PhoneNumber";
  attributes: {
    number: string;
    location: "Mobile" | "Home" | "Work" | "Pager" | "Fax" | "Skype" | "Other";
    primary: boolean;
    carrier?: string | null; // Read-only
    e164?: string; // Read-only, E.164 format
    international?: string; // Read-only
    national?: string; // Read-only
    country_code?: string; // Read-only
    created_at: string;
    updated_at: string;
  };
}

interface Address {
  id: string;
  type: "Address";
  attributes: {
    street: string; // Street address (line 1 + line 2)
    city: string;
    state: string;
    zip: string;
    location: "Home" | "Work" | "Other";
    primary: boolean;
    created_at: string;
    updated_at: string;
  };
}

interface Campus {
  id: string;
  type: "Campus";
  attributes: {
    name: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone_number?: string;
    website?: string;
    time_zone?: string;
    contact_email_address?: string;
  };
}

// ============================================
// Custom Fields Types
// ============================================

interface FieldDefinition {
  id: string;
  type: "FieldDefinition";
  attributes: {
    name: string;
    data_type: "text" | "paragraph" | "date" | "checkboxes" | "select";
    slug: string;
    sequence: number;
    config?: string;
  };
}

interface FieldDatum {
  id: string;
  type: "FieldDatum";
  attributes: {
    value: string;
    file?: string | null;
    file_name?: string | null;
  };
  relationships: {
    field_definition: { data: { type: "FieldDefinition"; id: string } };
    person: { data: { type: "Person"; id: string } };
  };
}

// ============================================
// API Response Types
// ============================================

interface JsonApiResponse<T> {
  data: T;
  included?: Array<Email | PhoneNumber | Address | Campus | FieldDatum>;
  meta?: {
    total_count?: number;
    count?: number;
    parent?: { type: string; id: string };
  };
  links?: {
    self: string;
    next?: string;
    prev?: string;
  };
}

interface JsonApiError {
  errors: Array<{
    status: string;
    code?: string;
    title: string;
    detail: string;
    source?: { pointer: string };
  }>;
}

interface ResourceIdentifier {
  type: string;
  id: string;
}

// ============================================
// Request Payload Types
// ============================================

interface CreatePersonPayload {
  data: {
    type: "Person";
    attributes: Partial<PersonAttributes> & {
      first_name: string; // Practically required
    };
  };
}

interface UpdatePersonPayload {
  data: {
    type: "Person";
    id: string;
    attributes: Partial<PersonAttributes>;
  };
}

interface CreateEmailPayload {
  data: {
    type: "Email";
    attributes: {
      address: string;
      location?: string;
      primary?: boolean;
    };
  };
}

interface CreatePhonePayload {
  data: {
    type: "PhoneNumber";
    attributes: {
      number: string;
      location?: string;
      primary?: boolean;
    };
  };
}

interface CreateAddressPayload {
  data: {
    type: "Address";
    attributes: {
      street: string;
      city: string;
      state: string;
      zip: string;
      location?: string;
      primary?: boolean;
    };
  };
}
```

---

## Common operations with code examples

### Complete API client setup

```typescript
// lib/planning-center.ts
import axios, { AxiosInstance, AxiosError } from "axios";

interface PCOClientConfig {
  accessToken?: string;
  appId?: string;
  secret?: string;
}

export class PlanningCenterClient {
  private client: AxiosInstance;
  private retryCount = 0;
  private maxRetries = 3;

  constructor(config: PCOClientConfig) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (config.accessToken) {
      headers["Authorization"] = `Bearer ${config.accessToken}`;
    } else if (config.appId && config.secret) {
      const credentials = Buffer.from(
        `${config.appId}:${config.secret}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
    }

    this.client = axios.create({
      baseURL: "https://api.planningcenteronline.com",
      headers,
    });

    this.client.interceptors.response.use(
      response => response,
      error => this.handleError(error)
    );
  }

  private async handleError(error: AxiosError): Promise<never> {
    if (error.response?.status === 429 && this.retryCount < this.maxRetries) {
      this.retryCount++;
      const retryAfter = parseInt(
        error.response.headers["retry-after"] || "20",
        10
      );
      console.log(`Rate limited. Retrying in ${retryAfter} seconds...`);
      await this.sleep(retryAfter * 1000);
      return this.client.request(error.config!);
    }
    this.retryCount = 0;
    throw error;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T>(
    path: string,
    params?: Record<string, any>
  ): Promise<JsonApiResponse<T>> {
    const response = await this.client.get(path, { params });
    return response.data;
  }

  async post<T>(path: string, data: any): Promise<JsonApiResponse<T>> {
    const response = await this.client.post(path, data);
    return response.data;
  }

  async patch<T>(path: string, data: any): Promise<JsonApiResponse<T>> {
    const response = await this.client.patch(path, data);
    return response.data;
  }

  async delete(path: string): Promise<void> {
    await this.client.delete(path);
  }
}

// Usage
const pco = new PlanningCenterClient({
  accessToken: process.env.PCO_ACCESS_TOKEN,
});
```

### Create a new visitor with full contact info

```typescript
interface VisitorData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  campusId?: string;
  howHeardAboutUs?: string; // Custom field
}

async function createVisitor(
  pco: PlanningCenterClient,
  visitor: VisitorData,
  fieldDefinitions: Map<string, string> // Map of field names to IDs
): Promise<Person> {
  // Step 1: Create the person
  const personResponse = await pco.post<Person>("/people/v2/people", {
    data: {
      type: "Person",
      attributes: {
        first_name: visitor.firstName,
        last_name: visitor.lastName,
        membership: "Visitor",
        ...(visitor.campusId && { primary_campus_id: visitor.campusId }),
      },
    },
  });

  const personId = personResponse.data.id;

  // Step 2: Add email
  if (visitor.email) {
    await pco.post(`/people/v2/people/${personId}/emails`, {
      data: {
        type: "Email",
        attributes: {
          address: visitor.email,
          location: "Home",
          primary: true,
        },
      },
    });
  }

  // Step 3: Add phone
  if (visitor.phone) {
    await pco.post(`/people/v2/people/${personId}/phone_numbers`, {
      data: {
        type: "PhoneNumber",
        attributes: {
          number: visitor.phone,
          location: "Mobile",
          primary: true,
        },
      },
    });
  }

  // Step 4: Add address
  if (visitor.address) {
    await pco.post(`/people/v2/people/${personId}/addresses`, {
      data: {
        type: "Address",
        attributes: {
          street: visitor.address.street,
          city: visitor.address.city,
          state: visitor.address.state,
          zip: visitor.address.zip,
          location: "Home",
          primary: true,
        },
      },
    });
  }

  // Step 5: Set custom field (e.g., "How did you hear about us?")
  if (visitor.howHeardAboutUs) {
    const fieldDefId = fieldDefinitions.get("how_heard_about_us");
    if (fieldDefId) {
      await pco.post(`/people/v2/people/${personId}/field_data`, {
        data: {
          type: "FieldDatum",
          attributes: {
            value: visitor.howHeardAboutUs,
            field_definition_id: fieldDefId,
          },
        },
      });
    }
  }

  return personResponse.data;
}
```

### Find duplicate by email before creating

```typescript
async function findPersonByEmail(
  pco: PlanningCenterClient,
  email: string
): Promise<Person | null> {
  const response = await pco.get<Person[]>("/people/v2/people", {
    "where[search_name_or_email]": email,
    include: "emails,phone_numbers,addresses",
    per_page: 1,
  });

  if (response.data.length > 0) {
    return response.data[0];
  }
  return null;
}

async function syncVisitor(
  pco: PlanningCenterClient,
  visitor: VisitorData,
  fieldDefinitions: Map<string, string>
): Promise<{ person: Person; isNew: boolean }> {
  // Check for existing person
  if (visitor.email) {
    const existing = await findPersonByEmail(pco, visitor.email);
    if (existing) {
      // Update existing person
      const updated = await updatePerson(pco, existing.id, visitor);
      return { person: updated, isNew: false };
    }
  }

  // Create new person
  const created = await createVisitor(pco, visitor, fieldDefinitions);
  return { person: created, isNew: true };
}
```

### Update an existing person

```typescript
async function updatePerson(
  pco: PlanningCenterClient,
  personId: string,
  visitor: Partial<VisitorData>
): Promise<Person> {
  const updatePayload: UpdatePersonPayload = {
    data: {
      type: "Person",
      id: personId,
      attributes: {},
    },
  };

  if (visitor.firstName)
    updatePayload.data.attributes.first_name = visitor.firstName;
  if (visitor.lastName)
    updatePayload.data.attributes.last_name = visitor.lastName;
  if (visitor.campusId)
    updatePayload.data.attributes.primary_campus_id = visitor.campusId;

  const response = await pco.patch<Person>(
    `/people/v2/people/${personId}`,
    updatePayload
  );

  return response.data;
}
```

### Handle pagination for large lists

```typescript
async function* iterateAllPeople(
  pco: PlanningCenterClient,
  includes?: string[]
): AsyncGenerator<Person> {
  let offset = 0;
  const perPage = 100;

  while (true) {
    const response = await pco.get<Person[]>("/people/v2/people", {
      per_page: perPage,
      offset,
      ...(includes && { include: includes.join(",") }),
    });

    for (const person of response.data) {
      yield person;
    }

    // Check if we've reached the end
    if (response.data.length < perPage || !response.links?.next) {
      break;
    }

    offset += perPage;
  }
}

// Usage
async function exportAllPeople(pco: PlanningCenterClient) {
  const allPeople: Person[] = [];

  for await (const person of iterateAllPeople(pco, [
    "emails",
    "phone_numbers",
  ])) {
    allPeople.push(person);
    console.log(`Loaded ${allPeople.length} people...`);
  }

  return allPeople;
}
```

### Batch sync with rate limit awareness

```typescript
interface SyncResult {
  created: number;
  updated: number;
  errors: Array<{ visitor: VisitorData; error: string }>;
}

async function batchSyncVisitors(
  pco: PlanningCenterClient,
  visitors: VisitorData[],
  fieldDefinitions: Map<string, string>,
  onProgress?: (current: number, total: number) => void
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < visitors.length; i++) {
    const visitor = visitors[i];

    try {
      const { isNew } = await syncVisitor(pco, visitor, fieldDefinitions);
      if (isNew) result.created++;
      else result.updated++;
    } catch (error) {
      result.errors.push({
        visitor,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    onProgress?.(i + 1, visitors.length);

    // Small delay to stay well under rate limits (100 req/20 sec)
    // With ~5 requests per visitor, process ~4 visitors per second max
    if (i < visitors.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }

  return result;
}
```

---

## Error handling

### Error response format

Planning Center returns JSON:API formatted errors:

```json
{
  "errors": [
    {
      "status": "422",
      "title": "Unprocessable Entity",
      "detail": "Email address is invalid",
      "source": {
        "pointer": "/data/attributes/address"
      }
    }
  ]
}
```

### Common errors and solutions

| Status  | Title                 | Common cause                     | Solution                                                              |
| ------- | --------------------- | -------------------------------- | --------------------------------------------------------------------- |
| **400** | Bad Request           | Malformed JSON or missing `type` | Verify JSON:API structure includes `data.type`                        |
| **401** | Unauthorized          | Invalid/expired token            | Refresh OAuth token or verify PAT credentials                         |
| **403** | Forbidden             | Insufficient permissions         | Check user has People permissions; verify OAuth scope                 |
| **404** | Not Found             | Invalid person/resource ID       | Verify ID exists; may have been deleted                               |
| **422** | Unprocessable Entity  | Validation error                 | Check `source.pointer` for field with issue                           |
| **429** | Too Many Requests     | Rate limit exceeded              | Wait `Retry-After` seconds and retry                                  |
| **500** | Internal Server Error | PCO server issue                 | Retry with exponential backoff; check status.planningcenteronline.com |

### Robust error handling implementation

```typescript
class PlanningCenterError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail: string,
    public source?: string
  ) {
    super(`${title}: ${detail}`);
    this.name = "PlanningCenterError";
  }
}

function handlePCOError(error: AxiosError<JsonApiError>): never {
  if (error.response?.data?.errors) {
    const firstError = error.response.data.errors[0];
    throw new PlanningCenterError(
      parseInt(firstError.status || String(error.response.status), 10),
      firstError.title,
      firstError.detail,
      firstError.source?.pointer
    );
  }
  throw error;
}

// Usage in try/catch
try {
  await pco.post("/people/v2/people", payload);
} catch (error) {
  if (error instanceof PlanningCenterError) {
    if (error.status === 422 && error.source === "/data/attributes/address") {
      console.error("Invalid email address provided");
    } else if (error.status === 429) {
      console.error("Rate limited - please wait before retrying");
    }
  }
  throw error;
}
```

---

## Rate limiting

### Rate limit specifications

| Metric        | Value                            |
| ------------- | -------------------------------- |
| Request limit | **100 requests per 20 seconds**  |
| Limit scope   | Per organization (not per token) |
| Error status  | HTTP 429                         |

### Monitoring headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
Retry-After: 12
```

### Recommended backoff strategy

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const retryAfter = parseInt(
          error.response.headers["retry-after"] || "20",
          10
        );
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 2000;
        const waitTime = retryAfter * 1000 + jitter;

        console.log(
          `Rate limited. Waiting ${Math.round(waitTime / 1000)}s (attempt ${attempt + 1}/${maxRetries + 1})`
        );
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Non-rate-limit error - don't retry
      throw error;
    }
  }

  throw lastError;
}
```

---

## Webhooks

Planning Center supports webhooks for real-time notifications when data changes—useful for keeping your visitor system synchronized without polling.

### Available events for People

- `people.v2.events.person.created`
- `people.v2.events.person.updated`
- `people.v2.events.person.destroyed`
- `people.v2.events.email.created`
- `people.v2.events.email.updated`
- `people.v2.events.email.destroyed`
- `people.v2.events.phone_number.created/updated/destroyed`
- `people.v2.events.address.created/updated/destroyed`

### Webhook configuration

Configure webhooks at [api.planningcenteronline.com/webhooks](https://api.planningcenteronline.com/webhooks):

1. Add your endpoint URL
2. Select events to subscribe
3. Save the signing secret

### Webhook payload verification

```typescript
import crypto from "crypto";

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Express.js webhook handler
app.post(
  "/webhooks/planning-center",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["x-pco-signature"] as string;

    if (
      !verifyWebhookSignature(
        req.body.toString(),
        signature,
        process.env.PCO_WEBHOOK_SECRET!
      )
    ) {
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());

    // Process based on event type
    switch (event.type) {
      case "Person":
        handlePersonWebhook(event);
        break;
    }

    res.status(200).send("OK");
  }
);
```

### Webhook reliability features

- **Automatic retry**: Up to 16 attempts with exponential backoff
- **Failure notifications**: Email after 1 hour of failures
- **Auto-deactivation**: Disabled after ~5 days of failures
- **Manual redelivery**: Available in developer interface
- **Delivery history**: Inspect past webhook deliveries for debugging

---

## Security considerations

### Token storage best practices

| Environment                      | Storage method                               |
| -------------------------------- | -------------------------------------------- |
| Server-side (Next.js API routes) | Environment variables, encrypted database    |
| Client secret                    | **Never expose**—keep server-side only       |
| Refresh tokens                   | Encrypted database with organization ID      |
| Access tokens                    | Short-term memory/cache (expires in 2 hours) |

```typescript
// Example: Secure token storage with encryption
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY!; // 32 bytes
const IV_LENGTH = 16;

function encryptToken(token: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(token);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decryptToken(encryptedToken: string): string {
  const [ivHex, encryptedHex] = encryptedToken.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

### Scope minimization

Request only the `people` scope for visitor management. Avoid requesting `giving`, `check_ins`, or other scopes unless your application specifically needs them.

### Data privacy for prayer requests

For optional prayer request syncing, consider these approaches:

```typescript
interface SyncConfig {
  syncPrayerRequests: boolean;
  prayerRequestFieldId?: string;
}

async function syncVisitorWithPrivacy(
  pco: PlanningCenterClient,
  visitor: VisitorData & { prayerRequest?: string },
  config: SyncConfig,
  fieldDefinitions: Map<string, string>
): Promise<Person> {
  const person = await createVisitor(pco, visitor, fieldDefinitions);

  // Only sync prayer request if explicitly enabled
  if (
    config.syncPrayerRequests &&
    visitor.prayerRequest &&
    config.prayerRequestFieldId
  ) {
    await pco.post(`/people/v2/people/${person.id}/field_data`, {
      data: {
        type: "FieldDatum",
        attributes: {
          value: visitor.prayerRequest,
          field_definition_id: config.prayerRequestFieldId,
        },
      },
    });
  }

  return person;
}
```

---

## Appendix

### Field mapping table

| Your Field           | Planning Center Field     | API Path                                 | Notes                                     |
| -------------------- | ------------------------- | ---------------------------------------- | ----------------------------------------- |
| First Name           | `first_name`              | `POST /people` → `attributes.first_name` | Use `given_name` for legal name           |
| Last Name            | `last_name`               | `attributes.last_name`                   |                                           |
| Email                | `address`                 | `POST /people/{id}/emails`               | Create after person; set `primary: true`  |
| Phone                | `number`                  | `POST /people/{id}/phone_numbers`        | Use `location: "Mobile"` for cell         |
| Street               | `street`                  | `POST /people/{id}/addresses`            | Include apt/unit in street field          |
| City                 | `city`                    | `attributes.city`                        |                                           |
| State                | `state`                   | `attributes.state`                       | Full name or abbreviation                 |
| ZIP                  | `zip`                     | `attributes.zip`                         |                                           |
| First Visit Date     | Custom field              | `POST /people/{id}/field_data`           | Create "First Visit Date" field first     |
| How Heard            | Custom field              | `field_data` with `field_definition_id`  | Create "How did you hear about us?" field |
| Volunteer Interests  | Custom field (checkboxes) | `field_data`                             | Values separated by `\|`                  |
| Small Group Interest | Custom field              | `field_data`                             | Boolean or text field                     |
| Prayer Request       | Custom field              | `field_data`                             | **Privacy**: Make sync configurable       |
| Campus               | `primary_campus_id`       | `attributes.primary_campus_id`           | Get ID from `GET /campuses`               |

### Status code reference

| Code    | Meaning              | Retry?                    |
| ------- | -------------------- | ------------------------- |
| 200     | Success              | N/A                       |
| 201     | Created              | N/A                       |
| 204     | Deleted (no content) | N/A                       |
| 400     | Bad request          | No—fix request            |
| 401     | Unauthorized         | No—re-authenticate        |
| 403     | Forbidden            | No—check permissions      |
| 404     | Not found            | No—verify resource exists |
| 422     | Validation error     | No—fix data               |
| 429     | Rate limited         | **Yes**—wait and retry    |
| 500     | Server error         | Yes—with backoff          |
| 502/503 | Service unavailable  | Yes—with backoff          |

### Testing recommendations

Planning Center does not provide a sandbox environment. For safe development:

1. **Create a test organization** at planningcenter.com (free)
2. **Use the API Explorer** at api.planningcenteronline.com/explorer for read-only testing
3. **Implement dry-run mode** in your sync code:

```typescript
async function syncVisitor(
  pco: PlanningCenterClient,
  visitor: VisitorData,
  options: { dryRun?: boolean } = {}
): Promise<{ person: Person | null; actions: string[] }> {
  const actions: string[] = [];

  if (options.dryRun) {
    actions.push(
      `Would create person: ${visitor.firstName} ${visitor.lastName}`
    );
    if (visitor.email) actions.push(`Would add email: ${visitor.email}`);
    if (visitor.phone) actions.push(`Would add phone: ${visitor.phone}`);
    return { person: null, actions };
  }

  // Actual sync logic...
}
```

### Glossary

| Term                 | Definition                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| **JSON:API**         | REST API specification used by Planning Center; requires `data`, `type`, `attributes` structure |
| **PAT**              | Personal Access Token—API credentials for single-organization access                            |
| **Include**          | JSON:API feature to sideload related resources in single request                                |
| **Field Definition** | Custom field configuration (name, type, options)                                                |
| **Field Datum**      | A person's value for a custom field                                                             |
| **Campus**           | Physical location/site for multi-site churches                                                  |
| **Membership**       | Person's status (custom values like "Visitor", "Member", "Regular Attender")                    |

### Useful links

- **Developer Portal**: https://developer.planning.center/docs/
- **API Explorer**: https://api.planningcenteronline.com/explorer
- **OAuth Applications**: https://api.planningcenteronline.com/oauth/applications
- **Status Page**: https://status.planningcenteronline.com
- **GitHub Examples**: https://github.com/planningcenter/developers
- **Community Slack**: Request access through Planning Center support
