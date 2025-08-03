# Product Filtering System - Working Version 1

## Overview
This document preserves the complete working product filtering system in the investments section. The system allows filtering investment products by category, risk profile, and liquidity with proper state management and API integration.

## Key Components

### 1. Frontend Filter UI (`client/src/pages/investments.tsx`)

#### Filter State Management
```typescript
const [filters, setFilters] = useState<{ category?: string; riskProfile?: string; liquidity?: string }>({});

const clearFilters = () => {
  setFilters({});
};

const hasActiveFilters = Object.values(filters).some(Boolean);
```

#### Filter Query Integration
```typescript
const { data: products, isLoading: productsLoading } = useQuery({
  queryKey: ["/api/investment-products", filters],
  queryFn: () => api.getInvestmentProducts(filters),
});
```

#### Filter UI Component (Lines 430-504)
```typescript
{/* Filters */}
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <Filter className="w-4 h-4" />
        Filter Products
      </CardTitle>
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Category Filter */}
      <div>
        <Label>Category</Label>
        <Select value={filters.category || "all"} onValueChange={(value) => 
          setFilters({...filters, category: value === "all" ? undefined : value})
        }>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="real_estate">Real Estate</SelectItem>
            <SelectItem value="corporate_credit">Corporate Credit</SelectItem>
            <SelectItem value="venture_capital">Venture Capital</SelectItem>
            <SelectItem value="digital_assets">Digital Assets</SelectItem>
            <SelectItem value="cash_deposit">Cash Deposits</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Risk Profile Filter */}
      <div>
        <Label>Risk Profile</Label>
        <Select value={filters.riskProfile || "all"} onValueChange={(value) => 
          setFilters({...filters, riskProfile: value === "all" ? undefined : value})
        }>
          <SelectTrigger>
            <SelectValue placeholder="All risk levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="conservative">Conservative</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="very_high">Very High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Liquidity Filter */}
      <div>
        <Label>Liquidity</Label>
        <Select value={filters.liquidity || "all"} onValueChange={(value) => 
          setFilters({...filters, liquidity: value === "all" ? undefined : value})
        }>
          <SelectTrigger>
            <SelectValue placeholder="All liquidity types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="locked">Locked Term</SelectItem>
            <SelectItem value="illiquid">Long-term Lock-in</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </CardContent>
</Card>
```

### 2. API Endpoint (`server/routes.ts` lines 1195-1215)

```typescript
app.get("/api/investment-products", async (req, res) => {
  try {
    const filters = {
      category: req.query.category as string,
      riskProfile: req.query.riskProfile as string,
      liquidity: req.query.liquidity as string,
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (!filters[key as keyof typeof filters]) {
        delete filters[key as keyof typeof filters];
      }
    });
    
    const products = await storage.getInvestmentProducts(Object.keys(filters).length > 0 ? filters : undefined);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to get investment products" });
  }
});
```

### 3. Storage Implementation

#### MemStorage Implementation (`server/storage.ts` lines 3157-3171)
```typescript
async getInvestmentProducts(filters?: { category?: string; riskProfile?: string; liquidity?: string }): Promise<InvestmentProduct[]> {
  const products = Array.from(this.investmentProducts.values()).filter(product => product.isActive);
  
  if (!filters) return products;
  
  return products.filter(product => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.riskProfile && product.riskProfile !== filters.riskProfile) return false;
    if (filters.liquidity) {
      const liquidityMatch = product.liquidity.toLowerCase().includes(filters.liquidity.toLowerCase());
      if (!liquidityMatch) return false;
    }
    return true;
  });
}
```

#### DatabaseStorage Implementation (`server/storage.ts` lines 3438-3450)
```typescript
async getInvestmentProducts(filters?: { category?: string; riskProfile?: string; liquidity?: string }): Promise<InvestmentProduct[]> {
  let query = db.select().from(investmentProducts);
  
  if (filters?.category) {
    query = query.where(eq(investmentProducts.category, filters.category));
  }
  if (filters?.riskProfile) {
    query = query.where(eq(investmentProducts.riskProfile, filters.riskProfile));
  }
  if (filters?.liquidity) {
    query = query.where(eq(investmentProducts.liquidity, filters.liquidity));
  }
  
  return await query;
}
```

## Filter Categories and Values

### Investment Categories
- `real_estate` - Real Estate
- `corporate_credit` - Corporate Credit  
- `venture_capital` - Venture Capital
- `digital_assets` - Digital Assets
- `cash_deposit` - Cash Deposits

### Risk Profiles
- `low` - Low
- `conservative` - Conservative
- `moderate` - Moderate
- `high` - High
- `very_high` - Very High

### Liquidity Types
- `daily` - Daily
- `monthly` - Monthly
- `quarterly` - Quarterly
- `locked` - Locked Term
- `illiquid` - Long-term Lock-in

## Working Features

### ✅ Filter State Management
- Filters stored in React state with proper typing
- Filters passed to TanStack Query for automatic refetching
- Clear filters functionality with visual indicator

### ✅ Multi-Filter Support
- Users can apply multiple filters simultaneously
- Filters work together (AND logic)
- Empty/undefined filters are properly handled

### ✅ API Integration
- Query parameters properly passed to backend
- Filters cleaned and validated on server side
- Both MemStorage and DatabaseStorage support filtering

### ✅ UI/UX Features
- Clear visual indication when filters are active
- "Clear" button appears when any filter is applied
- Filter selections properly reset to "All" when cleared
- Responsive grid layout for filter controls

### ✅ Performance
- Filters integrated with TanStack Query caching
- Automatic refetch when filters change
- Proper loading states during filter operations

## Testing Instructions

1. **Category Filter**: Select different categories and verify only products from that category appear
2. **Risk Profile Filter**: Select different risk levels and verify filtering works
3. **Liquidity Filter**: Select different liquidity types and verify matching
4. **Multiple Filters**: Apply category + risk profile + liquidity together
5. **Clear Filters**: Verify clear button appears when filters active and resets properly
6. **API Integration**: Check network tab to confirm API calls with proper query parameters

## Debugging Notes

- Query key includes filters object: `["/api/investment-products", filters]`
- TanStack Query will automatically refetch when filters object changes
- Server properly handles undefined filter values by removing them
- MemStorage uses includes() for liquidity matching (partial text search)
- DatabaseStorage uses exact equality for all filters

## Recovery Instructions

If filtering system breaks in future versions:
1. Verify filter state management matches the working patterns above
2. Check that TanStack Query queryKey includes filters dependency
3. Ensure API endpoint properly extracts and cleans query parameters
4. Verify storage layer implements filter logic correctly
5. Test that filter UI selections properly update state

This system provides robust, user-friendly product filtering with proper separation of concerns across UI, API, and data layers.