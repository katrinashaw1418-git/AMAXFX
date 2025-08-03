/**
 * PRODUCT FILTERING SYSTEM BACKUP - V1
 * Complete working filter implementation for investment products
 * 
 * This file preserves the exact filter UI, state management, and integration
 * that was working correctly. Use this for debugging if filters break.
 */

// Filter State Management (working implementation)
const [filters, setFilters] = useState<{ category?: string; riskProfile?: string; liquidity?: string }>({});

// Query with filters dependency
const { data: products, isLoading: productsLoading } = useQuery({
  queryKey: ["/api/investment-products", filters],
  queryFn: () => api.getInvestmentProducts(filters),
});

// Clear filters functionality
const clearFilters = () => {
  setFilters({});
};

const hasActiveFilters = Object.values(filters).some(Boolean);

// Working Filter UI Component
const FilterComponent = () => (
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
);

/**
 * CRITICAL POINTS FOR DEBUGGING:
 * 
 * 1. Filter State Type:
 *    { category?: string; riskProfile?: string; liquidity?: string }
 * 
 * 2. Query Key MUST include filters:
 *    queryKey: ["/api/investment-products", filters]
 * 
 * 3. Select onChange Pattern:
 *    value === "all" ? undefined : value
 *    This ensures "All" selections clear the filter
 * 
 * 4. hasActiveFilters Check:
 *    Object.values(filters).some(Boolean)
 *    Shows clear button when any filter is active
 * 
 * 5. Filter Values Match API:
 *    - Categories: real_estate, corporate_credit, venture_capital, digital_assets, cash_deposit
 *    - Risk: low, conservative, moderate, high, very_high  
 *    - Liquidity: daily, monthly, quarterly, locked, illiquid
 */

export default FilterComponent;