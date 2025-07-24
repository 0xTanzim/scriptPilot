# ## ✅ Your Ultimate Vite + React Component Architecture & Design Rules

## ### 🔰 1. **General Code Quality Principles**

- Write **clean, readable, and maintainable** code.
- ❌ Avoid: dead code, commented-out logic, inline spaghetti code, excessive nesting.
- ✅ Embrace: consistency, type safety (TypeScript), separation of concerns, and meaningful naming.

---

### 📦 2. **Vite-Specific Considerations**

- ⚡ Vite is optimized for speed. Keep startup lean—avoid global imports of heavy libraries.
- 🧱 Use `import.meta.env` for env vars instead of `process.env`.
- 🌍 Hot Module Replacement (HMR): prefer function components and hooks (no class components).
- ✅ Use `vite-plugin-*` utilities for enhancements (e.g., SVG loader, auto-imports).

---

### 🧠 3. **Component Design Principles**

### ✅ Single Responsibility Principle (SRP)

- Components should do **one thing**.
- Split concerns:
  - UI → Presentational Components
  - Logic → Hooks/Services

### 🧼 Dumb vs Smart Components

| Type  | Role                              |
| ----- | --------------------------------- |
| Dumb  | UI only, props-based, stateless   |
| Smart | Handles data/state, invokes hooks |

> ✅ Smart = minimal logic + hooks, Dumb = reusable, stateless.

### 🧱 Page Breakdown Example: `<ProductPage />`

```tsx
<ProductPage>
  <Header />
  <Hero />
  <Summary />
  <Details />
  <Reviews />
  <Footer />
</ProductPage>
```

---

### ✨ 4. **When to Create a New Component**

| Condition              | Description         | Priority |
| ---------------------- | ------------------- | -------- |
| 🔁 Reused in 2+ places | Extract             | ⭐⭐⭐   |
| 📏 > 100 LOC           | Too long = Extract  | ⭐⭐     |
| 🧠 Contains Logic      | Extract to hooks    | ⭐⭐⭐⭐ |
| 🧩 Visual Block        | Semantic unit       | ⭐⭐     |
| 🧪 Needs Testing       | Isolation for tests | ⭐⭐     |
| 🚀 Lazy Loadable       | Modals, Tabs        | ⭐⭐     |

---

### 🧠 5. **Hooks & Logic Abstraction**

- Keep UI and logic separate:
  - `hooks/` → state/effects logic
  - `services/` → data fetch/business logic
  - `lib/` → utils

✅ Example:

```tsx
// ❌ BAD
const Products = () => {
  const [items, setItems] = useState([]);
  useEffect(() => fetch().then(setItems), []);
  return <ProductList items={items} />;
};

// ✅ GOOD
const Products = () => {
  const { products } = useProducts();
  return <ProductList items={products} />;
};
```

---

### 📁 6. **Folder Structure (Feature-Based)**

```plaintext
/src
  /features
    /products
      ProductPage.tsx
      /components
        ProductCard.tsx
        ProductList.tsx
      /hooks
        useProductFilter.ts
      /services
        fetchProducts.ts
  /cart
    CartPage.tsx
    /components
    /hooks

  /components
    /ui
      Button.tsx
      Modal.tsx
    /layout
      Header.tsx
      Footer.tsx

  /hooks
    useDebounce.ts
    useToggle.ts

  /services
    /api
      http.ts
      auth.ts

  /types
    product.ts
    cart.ts

  /lib
    formatPrice.ts
    parseQuery.ts

  /constants
    paths.ts
    messages.ts

  /data
    mockProducts.ts

```

---

### 🎨 7. **UI & Composition Best Practices**

- Prefer **composition** over nesting.
- Break UI into small reusable chunks.

```tsx
// ✅ Composition
<Card>
  <CardHeader title='Order' />
  <CardBody>
    <ProductList items={products} />
  </CardBody>
</Card>
```

---

### 🧩 8. **React Design Patterns**

| Pattern     | Use When        | Benefits        |
| ----------- | --------------- | --------------- |
| HOC         | Auth, logging   | Logic reuse     |
| Compound    | Tabs, Accordion | Declarative API |
| Composition | Cards, Lists    | Modularity      |
| Context     | Theme, Auth     | Global state    |

---

### 🧹 9. **Component Clean-Up**

- ❌ No functions inside JSX scope
- ✅ Typed components with props interfaces
- ✅ Custom hooks for side effects
- ❌ Avoid `&&`/`? :` abuse in JSX
- ✅ Extract reusable sections (e.g., `Header`, `Section`, etc.)

---

### 🛡️ 10. **Error Handling**

- Wrap risky components in `<ErrorBoundary>`
- Use fallback UI:

```tsx
if (error) return <ErrorCard />;
```

---

### 🧠 11. **TypeScript Rules**

- `type` for unions and mapped types, `interface` for components
- Avoid `any`; prefer `unknown` + guards
- Use generics:

```typescript
type FetchResult<T> = { data: T; error?: Error };
```

---

### ♿️ 12. **Accessibility (a11y)**

- Use semantic HTML
- Label all interactive elements
- Support keyboard nav (tab, enter, escape)
- Don’t hide focus outlines

---

### 🧠 13. **Performance Optimizations**

- Use `React.memo`, `useMemo`, `useCallback` wisely
- Lazy-load routes, heavy components using `React.lazy`
- Break bundles with `vite-plugin-split`

---
