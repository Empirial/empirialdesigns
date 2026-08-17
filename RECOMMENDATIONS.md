# AI Website Generator - Recommendations

## 🎯 Core Features to Add

### 1. **Website Generation Flow**

#### A. Create New `create-website` Function
**Location:** `supabase/functions/create-website/index.ts`

**Purpose:** Generate complete website from scratch when user says "create a website" or "build me a [type] website"

**Features:**
- Detect generation intent vs editing intent
- Generate starter template files
- Create GitHub repo automatically
- Initial commit with all files
- Return repo info to user

#### B. Template System
Create reusable templates for common website types:

**Template Types:**
- Landing Page (with Hero, Features, Testimonials, CTA)
- E-commerce (Product listing, Cart, Checkout)
- Blog (Posts, Categories, Tags)
- Portfolio (Projects, About, Contact)
- SaaS Landing (Pricing, Features, Integrations)
- Restaurant (Menu, Reservations, Location)

**Storage:** Store in Supabase or GitHub as reference repos

### 2. **Enhanced AI Prompt for Generation**

Update `ai-chat/index.ts` system prompt to detect generation mode:

```typescript
// Detection logic
const isGenerationRequest = 
  messageLower.includes('create') || 
  messageLower.includes('build') || 
  messageLower.includes('generate') || 
  messageLower.includes('make me a') ||
  messageLower.includes('new website');

if (isGenerationRequest && !repoId) {
  // Route to generation workflow
  // Ask clarifying questions or proceed with generation
}
```

### 3. **Multi-File Generation**

**Current State:** AI can modify multiple files ✅
**Enhancement Needed:** Generate entire project structure from scratch

**Implementation:**
- When user requests generation, AI should provide:
  - `package.json` (with all dependencies)
  - `vite.config.ts`
  - `tsconfig.json` files
  - `tailwind.config.ts`
  - `index.html`
  - `src/App.tsx`
  - `src/main.tsx`
  - `src/index.css`
  - All component files
  - All in ONE response with proper paths

### 4. **Repository Creation Integration**

**Enhance `manage-repo` function:**

Add `action: 'create_and_generate'` that:
1. Creates empty GitHub repo
2. Generates all files via AI
3. Commits all files in initial commit
4. Stores in database
5. Returns repo info

### 5. **User Intent Understanding**

**Create intent detection system:**

```typescript
function detectWebsiteType(message: string): {
  type: 'landing' | 'ecommerce' | 'blog' | 'portfolio' | 'saas' | 'custom';
  features: string[];
  style: 'modern' | 'minimal' | 'corporate' | 'creative';
} {
  const msg = message.toLowerCase();
  
  // Type detection
  let type: string = 'landing';
  if (msg.includes('shop') || msg.includes('store') || msg.includes('ecommerce')) type = 'ecommerce';
  if (msg.includes('blog') || msg.includes('posts')) type = 'blog';
  if (msg.includes('portfolio') || msg.includes('projects')) type = 'portfolio';
  if (msg.includes('saas') || msg.includes('software')) type = 'saas';
  
  // Feature extraction
  const features: string[] = [];
  if (msg.includes('pricing')) features.push('pricing');
  if (msg.includes('contact')) features.push('contact-form');
  if (msg.includes('blog')) features.push('blog');
  // ... more features
  
  // Style detection
  let style = 'modern';
  if (msg.includes('minimal')) style = 'minimal';
  if (msg.includes('corporate')) style = 'corporate';
  
  return { type, features, style };
}
```

### 6. **GitHub Repository Creation**

**New function:** `supabase/functions/github-create-repo/index.ts`

```typescript
// Create empty repo on GitHub
const response = await fetch(`https://api.github.com/user/repos`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
  },
  body: JSON.stringify({
    name: repoName,
    description: 'AI-generated website',
    private: false,
    auto_init: false // We'll add files ourselves
  }),
});
```

### 7. **Initial Commit System**

**Enhance existing commit logic:**

When generating:
1. Create all files in memory
2. Use GitHub Tree API to create all files in one commit
3. Reference: https://docs.github.com/en/rest/git/trees

**Better approach for multiple files:**
```typescript
// Create blobs for each file
const blobs = await Promise.all(
  files.map(file => createBlob(file.content))
);

// Create tree with all files
const tree = await createTree(blobs.map((sha, i) => ({
  path: files[i].path,
  mode: '100644',
  type: 'blob',
  sha
})));

// Create commit
const commit = await createCommit(treeSha, 'Initial commit: AI-generated website');
```

### 8. **Template Library**

**Structure:**
```
supabase/templates/
  ├── landing-page/
  │   ├── files.json (list of files to generate)
  │   └── prompts.md (generation prompts)
  ├── ecommerce/
  ├── blog/
  └── portfolio/
```

**Use templates to:**
- Provide consistent structure
- Ensure all required files are generated
- Maintain best practices

### 9. **Enhanced UI Flow**

**New Page:** `src/pages/GenerateWebsite.tsx`

**Flow:**
1. User lands on generation page
2. Input: "I want a landing page for my SaaS"
3. AI asks clarifying questions (optional):
   - "What's your company name?"
   - "What colors do you prefer?"
   - "What features do you need?"
4. Generate → Create repo → Commit → Show preview
5. User can then continue editing via chat

### 10. **Generation vs Editing Mode**

**Detection Logic:**

```typescript
// In ai-chat function
const isNewGeneration = 
  !repoId && (
    messageLower.includes('create') ||
    messageLower.includes('build') ||
    messageLower.includes('generate') ||
    messageLower.includes('make me a') ||
    messageLower.includes('new website')
  );

if (isNewGeneration) {
  // Step 1: Create empty GitHub repo
  // Step 2: Generate all files
  // Step 3: Commit all files
  // Step 4: Store in database
  // Step 5: Return repo info
}
```

## 🚀 Implementation Priority

### Phase 1: MVP (Week 1-2)
1. ✅ Detect generation intent
2. ✅ Create `create-website` function
3. ✅ Generate basic landing page template
4. ✅ Auto-create GitHub repo
5. ✅ Initial commit with all files

### Phase 2: Enhanced Templates (Week 3-4)
1. ✅ Multiple template types
2. ✅ Intent detection system
3. ✅ Feature extraction
4. ✅ Custom styling options

### Phase 3: Advanced Features (Week 5+)
1. ✅ Multi-step generation wizard
2. ✅ Preview before generation
3. ✅ Template customization
4. ✅ Asset generation (images, icons)

## 📝 Code Structure Recommendations

### Directory Structure
```
supabase/functions/
  ├── ai-chat/ (existing - enhance for generation)
  ├── create-website/ (new - generation workflow)
  ├── github-create-repo/ (new - repo creation)
  ├── manage-repo/ (existing - add generation support)
  └── templates/ (new - template library)
```

### Database Enhancements
```sql
-- Add template tracking
ALTER TABLE user_repos ADD COLUMN template_type TEXT;
ALTER TABLE user_repos ADD COLUMN generation_prompt TEXT;
ALTER TABLE user_repos ADD COLUMN files_generated JSONB;
```

## 🎨 UX Improvements

1. **Generation Wizard:**
   - Step 1: What type of website?
   - Step 2: Basic info (name, description)
   - Step 3: Features selection
   - Step 4: Style preferences
   - Step 5: Generate!

2. **Progress Indicators:**
   - "Creating repository..."
   - "Generating files..."
   - "Committing changes..."
   - "Ready! 🎉"

3. **Template Gallery:**
   - Visual previews of templates
   - Click to use template
   - Customize before generating

## 💡 Advanced Features (Future)

1. **AI-Powered Customization:**
   - "Make it more colorful"
   - "Add a pricing section"
   - "Change to dark theme"

2. **Asset Generation:**
   - Generate placeholder images via AI
   - Create icons/logos
   - Optimize assets

3. **Deployment Integration:**
   - Auto-deploy to Netlify/Vercel
   - Custom domain setup
   - SSL certificate

4. **Version Control:**
   - Branch creation for major changes
   - Rollback capabilities
   - Change history

## 🔧 Technical Considerations

1. **Rate Limits:**
   - GitHub API rate limits
   - OpenRouter API costs
   - Batch operations where possible

2. **Error Handling:**
   - Retry logic for GitHub operations
   - Graceful degradation
   - User-friendly error messages

3. **Performance:**
   - Cache templates
   - Parallel file generation
   - Optimize API calls

4. **Security:**
   - Validate user inputs
   - Sanitize file paths
   - Rate limit generation requests

## 📊 Success Metrics

Track:
- Generation success rate
- Time to generate
- User satisfaction
- Edit frequency after generation
- Deployment rate

---

## 🎯 Quick Start Implementation

**Start with:**
1. Update `ai-chat` to detect generation intent
2. Create basic `create-website` function
3. Generate minimal landing page template
4. Test end-to-end flow
5. Iterate based on feedback

Would you like me to implement any of these features?

