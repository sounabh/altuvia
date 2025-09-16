# University Search Application - Complete Documentation

## 🏗️ Architecture Overview

This is a Next.js-based university search application with the following tech stack:
- **Frontend**: React 19+ with Next.js App Router
- **Backend**: Next.js API routes with Prisma ORM with Node.js
- **Database**: PostgreSQL/MySQL (via Prisma)
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React

## 📁 Component Structure

```
components/
├── UniversityCard.jsx         # Individual university display card
├── UniversityGrid.jsx         # Grid container with data fetching
├── FilterSection.jsx          # GMAT & Ranking filters
├── SearchBar.jsx             # Main search input
└── SearchFilters.jsx         # Comprehensive search component
```

---

## 🧩 Component Analysis

### 1. UniversityCard Component

**Purpose**: Renders individual university information in a card format with save functionality.

#### Key Features:

- **Heart Button**: Save/unsave universities (optimistic updates)
- **Ranking Badge**: Displays university ranking
- **Metrics Grid**: GMAT scores, acceptance rates
- **Financial Info**: Tuition and application fees
- **Hover Effects**: Interactive animations and click indicators

#### State Management:
```javascript
const [isAdded, setIsAdded] = useState(false);     // Save state
const [isLoading, setIsLoading] = useState(false); // Loading state
const [isHovered, setIsHovered] = useState(false); // Hover state
```

#### Core Functions:

**toggleHeart()** - Save/Unsave Logic:
```javascript
const toggleHeart = useCallback(async (e) => {
  e.stopPropagation();
  e.preventDefault();

  // 1. Extract auth token from localStorage
  let authData = localStorage.getItem("authData");
  const token = JSON.parse(authData).token;

  // 2. Optimistic UI update
  const previousState = isAdded;
  const newState = !isAdded;
  setIsAdded(newState);
  setIsLoading(true);

  // 3. API call to toggle saved state
  const response = await fetch('/api/university/toggleSaved', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ universityId: university?.id }),
  });

  // 4. Handle response and revert on error
  if (response.ok) {
    const data = await response.json();
    setIsAdded(Boolean(data.isAdded));
  } else {
    setIsAdded(previousState); // Revert on error
  }
}, [isAdded, university?.id]);
```

#### Data Flow:
1. Receives `university` prop from UniversityGrid
2. Initializes saved state from `university.isAdded`
3. Handles user interactions (save/click)
4. Navigates to university detail page on click

---

### 2. UniversityGrid Component

**Purpose**: Container component that fetches and displays universities in a grid layout.

#### Key Features:
- **Smart Caching**: 5-minute cache with Map-based storage
- **Request Cancellation**: AbortController for preventing race conditions
- **Debounced Search**: 300ms delay for search queries
- **Error Handling**: Graceful error states with retry functionality

#### State Management:
```javascript
const [universities, setUniversities] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

#### Core Functions:

**fetchData()** - Main Data Fetching Logic:
```javascript
const fetchData = useCallback(async (paramsString, forceRefresh = false) => {
  // 1. Check cache first (5-minute validity)
  const cached = cacheRef.current.get(paramsString);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < 300000) {
    setUniversities(cached.data);
    return;
  }

  // 2. Abort previous request
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  abortControllerRef.current = new AbortController();

  // 3. Make API request
  const params = JSON.parse(paramsString);
  const urlParams = new URLSearchParams(params);
  const response = await fetch(`/api/universities?${urlParams}`, {
    signal: abortControllerRef.current.signal,
    headers: { 'Cache-Control': 'public, max-age=300' }
  });

  // 4. Update state and cache
  const result = await response.json();
  setUniversities(result.data);
  cacheRef.current.set(paramsString, {
    data: result.data,
    timestamp: Date.now()
  });
}, []);
```

#### Caching Strategy:
- **Cache Storage**: JavaScript Map with timestamp-based expiry
- **Cache Duration**: 5 minutes (300,000ms)
- **Cache Size Limit**: 10 entries (LRU eviction)
- **Cache Keys**: Stringified search parameters

#### Data Flow:
1. Receives search parameters as props
2. Memoizes search params to prevent unnecessary requests
3. Debounces search queries (300ms delay)
4. Fetches data with caching and error handling
5. Renders UniversityCard components for each result

---

### 3. FilterSection Component

**Purpose**: Provides dropdown filters for GMAT scores and university rankings.

#### Filter Options:

**GMAT Averages**:
```javascript
const gmatAverages = [
  { value: 'all', label: 'All Scores' },
  { value: '700+', label: '700 and above' },
  { value: '650-699', label: '650 - 699' },
  { value: '600-649', label: '600 - 649' },
  { value: 'below-600', label: 'Below 600' }
];
```

**Rankings**:
```javascript
const rankings = [
  { value: 'all', label: 'All Ranks' },
  { value: 'top-10', label: 'Top 10' },
  { value: 'top-50', label: 'Top 50' },
  { value: 'top-100', label: 'Top 100' },
  { value: '100+', label: 'Ranked 100+' }
];
```

#### UI Features:
- **Memoized Dropdowns**: Prevents unnecessary re-renders
- **Glassmorphism Effect**: backdrop-blur styling
- **Hover Animations**: Smooth transitions on user interaction

---

### 4. SearchBar Component

**Purpose**: Primary search input with enhanced visual design.

#### Key Features:
- **Gradient Effects**: Multi-layer glow effects on hover
- **Clear Button**: Appears when search query exists
- **Responsive Design**: Adapts to different screen sizes
- **Smooth Animations**: 500ms transition durations

#### Visual Effects:
- **Backdrop Blur**: `backdrop-blur-lg` for glassmorphism
- **Shadow Layers**: Multiple shadow effects for depth
- **Scale Animations**: `hover:scale-110` for interactive elements

---

### 5. SearchFilters Component (Alternative)

**Purpose**: Comprehensive search interface using shadcn/ui components.

#### Features:
- **Active Filter Count**: Shows number of applied filters
- **Clear All Button**: Resets all filters and search
- **Modern UI**: Uses shadcn/ui Select components
- **Responsive Grid**: Adapts layout for different screen sizes

#### Filter Management:
```javascript
useEffect(() => {
  let count = 0;
  if (selectedRankFilter && selectedRankFilter !== 'all') count++;
  if (selectedGmatFilter && selectedGmatFilter !== 'all') count++;
  setActiveFilters(count);
}, [selectedRankFilter, selectedGmatFilter]);
```

---

## 🔌 API Layer Analysis

### `/api/universities` Endpoint

**Purpose**: Main API endpoint for fetching filtered university data.

#### Request Parameters:
- `search`: Text search across name, city, country
- `gmat`: GMAT score filter ('all', '700+', '650-699', etc.)
- `ranking`: University ranking filter ('all', 'top-10', 'top-50', etc.)

#### Database Query Logic:

**WHERE Clause Building**:
```javascript
const whereClause = { AND: [] };

// Search filter
if (search) {
  whereClause.AND.push({
    OR: [
      { universityName: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
      { country: { contains: search, mode: 'insensitive' } }
    ]
  });
}

// GMAT filter
if (gmat === '700+') {
  whereClause.AND.push({ gmatAverageScore: { gte: 700 } });
}

// Ranking filter
if (ranking === 'top-10') {
  whereClause.AND.push({ ftGlobalRanking: { lte: 10, not: null } });
}
```

#### Prisma Query Optimization:
```javascript
const universities = await prisma.university.findMany({
  where: whereClause.AND.length > 0 ? whereClause : undefined,
  include: {
    images: {
      where: { isPrimary: true },
      take: 1, // Only primary image
    },
    savedByUsers: {
      where: { email: session?.user?.email },
      select: { id: true }, // Minimal data
    },
  },
  take: 50, // Limit results
  orderBy: [
    { ftGlobalRanking: 'asc' },
    { universityName: 'asc' }
  ],
});
```

#### Data Transformation:
```javascript
const transformed = universities.map(u => ({
  id: u.id,
  slug: u.slug,
  name: u.universityName,
  location: `${u.city}, ${u.country}`,
  image: u.images[0]?.imageUrl || '/default-university.jpg',
  rank: u.ftGlobalRanking ? `#${u.ftGlobalRanking}` : 'N/A',
  gmatAvg: u.gmatAverageScore || 0,
  acceptRate: u.acceptanceRate || 0,
  tuitionFee: u.tuitionFees ? `${u.tuitionFees.toLocaleString()}` : 'N/A',
  applicationFee: u.additionalFees ? `${u.additionalFees.toLocaleString()}` : 'N/A',
  pros: u.whyChooseHighlights || [],
  isAdded: u.savedByUsers?.length > 0, // Boolean transformation
}));
```

#### Response Format:
```json
{
  "data": [/* transformed universities */],
  "count": 25,
  "total": 25
}
```

#### Caching Headers:
```javascript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
  }
});
```

---

## 🔄 Data Flow Architecture

### 1. User Search Flow
```
User Input → SearchBar/SearchFilters → Parent Component → UniversityGrid
                                                              ↓
API Request ← URL Parameters ← Memoized Search Params ←────────┘
     ↓
Database Query (Prisma) → Data Transformation → JSON Response
     ↓
Frontend Cache → State Update → UniversityCard Rendering
```

### 2. Save/Unsave Flow
```
User Click → UniversityCard.toggleHeart()
                    ↓
localStorage Auth Check → Optimistic UI Update
                    ↓
POST /api/university/toggleSaved → Database Update
                    ↓
Response Success/Error → Final State Update/Reversion
```

### 3. Filter Application Flow
```
Filter Change → Parent State Update → Search Params Memoization
                       ↓
Debounced API Call → Cache Check → Database Query → UI Update
```

---

## 💾 Caching Strategy

### Frontend Caching (UniversityGrid)
```javascript
// Cache structure
cacheRef.current = new Map([
  ['{"search":"","gmat":"all","ranking":"all"}', {
    data: [...universities],
    timestamp: 1704067200000
  }]
]);

// Cache validity check
const cacheValidTime = 300000; // 5 minutes
const isValid = Date.now() - cached.timestamp < cacheValidTime;
```

### Backend Caching (API Response)
```javascript
// HTTP caching headers
'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
// - public: Can be cached by any cache
// - s-maxage: Server cache for 5 minutes
// - stale-while-revalidate: Serve stale content while revalidating
```

### Authentication Caching
```javascript
// localStorage structure
localStorage.getItem("authData") = {
  "token": "jwt_token_here",
  "user": { /* user data */ }
}
```

---

## 🎨 UI/UX Design Patterns

### Visual Hierarchy
1. **Primary**: University name and ranking badge
2. **Secondary**: Location and key metrics
3. **Tertiary**: Financial information and advantages

### Color System
- **Primary Blue**: `#3598FE` (CTAs and highlights)
- **Navy**: `#002147` (headers and important text)
- **Grays**: Various shades for text and backgrounds
- **Semantic Colors**: Green (advantages), Red (errors), Amber (costs)

### Animation Patterns
- **Hover Transforms**: `hover:-translate-y-1` for cards
- **Scale Effects**: `hover:scale-110` for buttons
- **Transition Duration**: 200-500ms for smooth interactions
- **Loading States**: Skeleton animations and spinners

### Responsive Design
```css
/* Grid system */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

/* Spacing */
gap-4 sm:gap-6

/* Text sizing */
text-lg sm:text-xl
```

---

## 🔒 Security Considerations

### Authentication
- JWT tokens stored in localStorage
- Bearer token authentication for API requests
- Session validation on server-side

### Data Validation
- Input sanitization in API routes
- Prisma ORM prevents SQL injection
- CORS handling through Next.js

### Error Handling
- Graceful error states in UI
- Optimistic updates with rollback
- Network error detection and retry

---

## 🚀 Performance Optimizations

### React Optimizations
- **memo()**: Prevents unnecessary re-renders
- **useCallback()**: Memoizes functions
- **useMemo()**: Memoizes expensive calculations
- **Lazy Loading**: Images with `loading="lazy"`

### Network Optimizations
- **Debounced Requests**: 300ms delay for searches
- **Request Cancellation**: AbortController prevents race conditions
- **Selective Data Fetching**: Only required fields in Prisma queries
- **Pagination**: Limited to 50 results per request

### Database Optimizations
- **Indexed Queries**: Likely indexes on ranking and GMAT scores
- **Minimal Relations**: Only fetch required related data
- **Efficient Ordering**: Database-level sorting

---

## 🐛 Error Handling

### Frontend Error Handling
```javascript
// Network errors
catch (error) {
  if (error.name !== 'AbortError') {
    setError(error.message);
    setUniversities([]);
  }
}

// Auth errors
if (!token) {
  alert("Authentication expired, please login again");
  return;
}
```

### Backend Error Handling
```javascript
try {
  // Database operations
} catch (error) {
  console.error("Database error:", error);
  return NextResponse.json(
    { error: "Failed to fetch universities", data: [], count: 0 },
    { status: 500 }
  );
}
```

### User Experience
- **Loading States**: Skeleton screens during fetch
- **Empty States**: Friendly messages when no results
- **Error States**: Clear error messages with retry options
- **Optimistic Updates**: Immediate UI feedback

---

## 📊 Data Models (Inferred from Code)

### University Model
```typescript
interface University {
  id: string;
  slug?: string;
  universityName: string;
  city: string;
  country: string;
  ftGlobalRanking?: number;
  gmatAverageScore?: number;
  acceptanceRate?: number;
  tuitionFees?: number;
  additionalFees?: number;
  whyChooseHighlights?: string[];
  images: UniversityImage[];
  savedByUsers: SavedUniversity[];
}

interface UniversityImage {
  imageUrl: string;
  isPrimary: boolean;
}

interface SavedUniversity {
  id: string;
  email: string;
}
```

### API Response Format
```typescript
interface APIResponse {
  data: TransformedUniversity[];
  count: number;
  total: number;
}

interface TransformedUniversity {
  id: string;
  slug?: string;
  name: string;
  location: string;
  image: string;
  rank: string;
  gmatAvg: number;
  acceptRate: number;
  tuitionFee: string;
  applicationFee: string;
  pros: string[];
  cons: string[];
  isAdded: boolean;
}
```

---

## 🔄 State Management Flow

### Component Hierarchy
```
Parent Component
    ↓
SearchFilters / SearchBar + FilterSection
    ↓
UniversityGrid
    ↓
UniversityCard (multiple)
```

### State Flow
1. **Search/Filter State**: Managed by parent component
2. **University Data**: Managed by UniversityGrid
3. **Individual Card State**: Managed by UniversityCard
4. **Cache State**: Managed by refs in UniversityGrid

### Props Flow
```javascript
// Parent → UniversityGrid
<UniversityGrid 
  searchQuery={searchQuery}
  selectedGmat={selectedGmat}
  selectedRanking={selectedRanking}
/>

// UniversityGrid → UniversityCard
<UniversityCard 
  university={university}
  onToggleSuccess={handleToggleSuccess}
/>
```

---

## 📱 Responsive Behavior

### Breakpoints
- **Mobile**: `< 640px` - Single column, compact layout
- **Tablet**: `640px - 1024px` - Two columns, medium spacing
- **Desktop**: `1024px+` - Three columns, full features

### Adaptive Elements
- **Grid Layout**: Responsive column count
- **Search Bar**: Full width on mobile, constrained on desktop
- **Filters**: Stack vertically on small screens
- **Card Layout**: Simplified metrics on mobile

---

This documentation covers the complete architecture, data flow, caching strategies, UI patterns, and implementation details of the university search application. Each component is designed with performance, user experience, and maintainability in mind.