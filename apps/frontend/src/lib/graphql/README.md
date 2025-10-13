# GraphQL API Layer

Clean, feature-based GraphQL architecture using Apollo Client and `gql` tags.

**Replaces:** The old messy `lib/api/dgraph.ts` file (6000+ lines of string queries)

## 📁 Structure

```
src/lib/graphql/
├── client.ts              # Apollo Client configuration
├── fragments.ts           # Shared GraphQL fragments (reusable field sets)
├── utils.ts              # Helper utilities
├── features/             # Feature-based organization
│   ├── user/
│   │   ├── queries.ts    # All user queries with gql tags
│   │   ├── mutations.ts  # All user mutations with gql tags
│   │   ├── api.ts        # Clean API functions wrapping queries/mutations
│   │   └── index.ts      # Feature exports
│   ├── challenge/        # (To be created)
│   ├── nft/             # (To be created)
│   ├── notification/    # (To be created)
│   └── invite/          # (To be created)
└── index.ts             # Main exports
```

## ✨ What's Different

### Before (Old dgraph.ts) ❌
```typescript
import axios from 'axios';

export const getUserFromDgraph = async (wallet: string) => {
  const mutation = `
    query GetUser($wallet: String!) {
      queryUser(filter: { wallet: { eq: $wallet } }) {
        id
        username
        bio
        // 50+ lines of fields...
      }
    }
  `;
  
  const response = await axios.post(ENDPOINT, {
    query: mutation,
    variables: { wallet }
  });
  
  return response.data.data.queryUser[0];
};
```

### After (New graphql/) ✅
```typescript
// features/user/queries.ts
import { gql } from '@apollo/client';
import { USER_WITH_RELATIONS } from '../../fragments';

export const GET_USER_BY_WALLET = gql`
  query GetUserByWallet($wallet: String!) {
    queryUser(filter: { wallet: { eq: $wallet } }) {
      ...UserWithRelations
    }
  }
  ${USER_WITH_RELATIONS}
`;

// features/user/api.ts
import graphqlClient from '../../client';
import * as queries from './queries';

export async function getUserByWallet(wallet: string): Promise<User | null> {
  const { data } = await graphqlClient.query({
    query: queries.GET_USER_BY_WALLET,
    variables: { wallet }
  });
  
  return formatUserData(data.queryUser?.[0]);
}
```

## 🚀 Usage

### Import from main index:
```typescript
import { 
  getUserByWallet,
  registerUser,
  updateBio,
  graphqlClient 
} from '@/lib/graphql';
```

### Or import specific features:
```typescript
import { getUserByWallet } from '@/lib/graphql/features/user';
import { userQueries, userMutations } from '@/lib/graphql/features/user';
```

### Use Apollo Client hooks (in components):
```typescript
import { useQuery } from '@apollo/client';
import { userQueries } from '@/lib/graphql/features/user';
import { graphqlClient } from '@/lib/graphql';

function UserProfile({ wallet }) {
  const { data, loading } = useQuery(userQueries.GET_USER_BY_WALLET, {
    variables: { wallet },
    client: graphqlClient
  });
  
  const user = data?.queryUser?.[0];
  // ... use user
}
```

## 📋 Fragments

Reusable field sets defined in `fragments.ts`:

- **User Fragments:**
  - `USER_BASIC_FIELDS` - Basic user info
  - `USER_WITH_RELATIONS` - User with followers/following
  - `USER_WITH_EQUIPMENT` - User with NFT equipment & avatars

- **Challenge Fragments:**
  - `PRIVATE_CHALLENGE_FIELDS`
  - `PUBLIC_CHALLENGE_FIELDS`
  - `AI_CHALLENGE_FIELDS`
  - `CHALLENGE_COMPLETION_FIELDS`

- **NFT Fragments:**
  - `NFT_ITEM_FIELDS`
  - `AVATAR_FIELDS`

- **Notification Fragments:**
  - `NOTIFICATION_FIELDS`

## 🔄 Migration Status

### ✅ Completed:
- Apollo Client setup
- Shared fragments
- **User feature** - Fully migrated with gql tags
- Import updates across codebase
- Backward compatibility maintained

### 📦 Still using old dgraph.ts (will migrate incrementally):
- Challenge operations
- NFT operations
- Notification operations
- Invite operations
- Avatar operations
- Completion operations
- Leaderboard operations

These are temporarily re-exported from old `dgraph.ts` for backward compatibility.

## 🎯 Benefits

### Type Safety
✅ Full TypeScript support  
✅ IDE autocomplete for queries  
✅ Compile-time error detection  

### Organization
✅ Feature-based structure (easy to find)  
✅ Separate queries from mutations  
✅ Reusable fragments (DRY principle)  

### Developer Experience
✅ Clean, readable code  
✅ Easy to test  
✅ Easy to extend  

### Performance
✅ Apollo Client caching  
✅ Optimistic updates  
✅ Request deduplication  

## 📝 How to Add New Features

1. **Create feature folder:**
   ```
   src/lib/graphql/features/my-feature/
   ├── queries.ts
   ├── mutations.ts
   ├── api.ts
   └── index.ts
   ```

2. **Define queries with gql:**
   ```typescript
   // queries.ts
   import { gql } from '@apollo/client';
   
   export const GET_MY_DATA = gql`
     query GetMyData($id: String!) {
       queryMyData(filter: { id: { eq: $id } }) {
         id
         name
       }
     }
   `;
   ```

3. **Wrap in API functions:**
   ```typescript
   // api.ts
   import graphqlClient from '../../client';
   import * as queries from './queries';
   
   export async function getMyData(id: string) {
     const { data } = await graphqlClient.query({
       query: queries.GET_MY_DATA,
       variables: { id }
     });
     return data.queryMyData[0];
   }
   ```

4. **Export from feature:**
   ```typescript
   // index.ts
   export * from './api';
   export * as myFeatureQueries from './queries';
   export * as myFeatureMutations from './mutations';
   ```

5. **Add to main index:**
   ```typescript
   // graphql/index.ts
   export * from './features/my-feature';
   ```

## 🔗 Backward Compatibility

Old imports still work:
```typescript
// Old way (still works)
import { getUserFromDgraph } from '@/lib/graphql';

// New way (recommended)
import { getUserByWallet } from '@/lib/graphql';
```

The main index re-exports user functions with old names:
- `getUserFromDgraph` → `getUserByWallet`
- `getUserByIdFromDgraph` → `getUserById`

## 🧹 Next Steps

1. **Migrate remaining features incrementally:**
   - Extract challenge operations to `features/challenge/`
   - Extract NFT operations to `features/nft/`
   - Extract notification operations to `features/notification/`
   - Extract invite operations to `features/invite/`

2. **Remove old dgraph.ts** once all features are migrated

3. **Update function names** to use new naming convention

## 💡 Tips

- **Use fragments** - Define once, reuse everywhere
- **Keep queries focused** - One query per use case
- **Name clearly** - `GET_USER_BY_WALLET` is better than `getUserQuery`
- **Format responses** - Transform data in API layer, not components
- **Handle errors** - Consistent error handling in API functions

---

**Result:** Clean, maintainable, type-safe GraphQL layer! 🎉

