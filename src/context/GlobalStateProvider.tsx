import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';

// Types for global state
export interface EntityState<T = any> {
  data: Record<string, T>;
  lists: Record<string, T[]>;
  loading: Record<string, boolean>;
  errors: Record<string, any>;
  lastFetch: Record<string, number>;
}

export interface GlobalState {
  entities: Record<string, EntityState>;
}

export type GlobalAction =
  | { type: 'SET_ENTITY_DATA'; entity: string; id: string; data: any }
  | { type: 'SET_ENTITY_LIST'; entity: string; key: string; data: any[] }
  | { type: 'SET_LOADING'; entity: string; key: string; loading: boolean }
  | { type: 'SET_ERROR'; entity: string; key: string; error: any }
  | { type: 'CLEAR_ENTITY_CACHE'; entity: string }
  | { type: 'INVALIDATE_ENTITY'; entity: string }
  | { type: 'OPTIMISTIC_UPDATE'; entity: string; id: string; data: any; tempId?: string }
  | { type: 'ROLLBACK_OPTIMISTIC'; entity: string; tempId: string }
  | { type: 'CONFIRM_OPTIMISTIC'; entity: string; tempId: string; realData: any };

// Global state reducer
function globalStateReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'SET_ENTITY_DATA': {
      const { entity, id, data } = action;
      return {
        ...state,
        entities: {
          ...state.entities,
          [entity]: {
            ...state.entities[entity],
            data: {
              ...state.entities[entity]?.data,
              [id]: data,
            },
            lastFetch: {
              ...state.entities[entity]?.lastFetch,
              [id]: Date.now(),
            },
          },
        },
      };
    }

    case 'SET_ENTITY_LIST': {
      const { entity, key, data } = action;
      return {
        ...state,
        entities: {
          ...state.entities,
          [entity]: {
            ...state.entities[entity],
            lists: {
              ...state.entities[entity]?.lists,
              [key]: data,
            },
            lastFetch: {
              ...state.entities[entity]?.lastFetch,
              [key]: Date.now(),
            },
          },
        },
      };
    }

    case 'SET_LOADING': {
      const { entity, key, loading } = action;
      return {
        ...state,
        entities: {
          ...state.entities,
          [entity]: {
            ...state.entities[entity],
            loading: {
              ...state.entities[entity]?.loading,
              [key]: loading,
            },
          },
        },
      };
    }

    case 'SET_ERROR': {
      const { entity, key, error } = action;
      return {
        ...state,
        entities: {
          ...state.entities,
          [entity]: {
            ...state.entities[entity],
            errors: {
              ...state.entities[entity]?.errors,
              [key]: error,
            },
          },
        },
      };
    }

    case 'CLEAR_ENTITY_CACHE': {
      const { entity } = action;
      return {
        ...state,
        entities: {
          ...state.entities,
          [entity]: {
            data: {},
            lists: {},
            loading: {},
            errors: {},
            lastFetch: {},
          },
        },
      };
    }

    case 'INVALIDATE_ENTITY': {
      const { entity } = action;
      return {
        ...state,
        entities: {
          ...state.entities,
          [entity]: {
            ...state.entities[entity],
            lastFetch: {},
          },
        },
      };
    }

    case 'OPTIMISTIC_UPDATE': {
      const { entity, id, data, tempId } = action;
      const actualId = tempId || id;
      return {
        ...state,
        entities: {
          ...state.entities,
          [entity]: {
            ...state.entities[entity],
            data: {
              ...state.entities[entity]?.data,
              [actualId]: { ...data, _optimistic: true, _tempId: tempId },
            },
          },
        },
      };
    }

    case 'ROLLBACK_OPTIMISTIC': {
      const { entity, tempId } = action;
      const entityState = state.entities[entity];
      if (!entityState) return state;

      const { [tempId]: _, ...remainingData } = entityState.data;
      return {
        ...state,
        entities: {
          ...state.entities,
          [entity]: {
            ...entityState,
            data: remainingData,
          },
        },
      };
    }

    case 'CONFIRM_OPTIMISTIC': {
      const { entity, tempId, realData } = action;
      const entityState = state.entities[entity];
      if (!entityState) return state;

      const { [tempId]: _, ...remainingData } = entityState.data;
      return {
        ...state,
        entities: {
          ...state.entities,
          [entity]: {
            ...entityState,
            data: {
              ...remainingData,
              [realData.id]: realData,
            },
          },
        },
      };
    }

    default:
      return state;
  }
}

// Context
const GlobalStateContext = createContext<{
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
} | null>(null);

// Provider component
interface GlobalStateProviderProps {
  children: ReactNode;
  initialState?: Partial<GlobalState>;
}

export function GlobalStateProvider({ children, initialState }: GlobalStateProviderProps) {
  const [state, dispatch] = useReducer(globalStateReducer, {
    entities: {},
    ...initialState,
  });

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <GlobalStateContext.Provider value={value}>{children}</GlobalStateContext.Provider>;
}

// Hook to use global state
export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
}

// Hook to use entity-specific state
export function useEntityState<T = any>(entity: string) {
  const { state, dispatch } = useGlobalState();

  const entityState = state.entities[entity] || {
    data: {},
    lists: {},
    loading: {},
    errors: {},
    lastFetch: {},
  };

  const actions = useMemo(
    () => ({
      setData: (id: string, data: T) => dispatch({ type: 'SET_ENTITY_DATA', entity, id, data }),

      setList: (key: string, data: T[]) => dispatch({ type: 'SET_ENTITY_LIST', entity, key, data }),

      setLoading: (key: string, loading: boolean) =>
        dispatch({ type: 'SET_LOADING', entity, key, loading }),

      setError: (key: string, error: any) => dispatch({ type: 'SET_ERROR', entity, key, error }),

      clearCache: () => dispatch({ type: 'CLEAR_ENTITY_CACHE', entity }),

      invalidate: () => dispatch({ type: 'INVALIDATE_ENTITY', entity }),

      optimisticUpdate: (id: string, data: T, tempId?: string) =>
        dispatch({ type: 'OPTIMISTIC_UPDATE', entity, id, data, tempId }),

      rollbackOptimistic: (tempId: string) =>
        dispatch({ type: 'ROLLBACK_OPTIMISTIC', entity, tempId }),

      confirmOptimistic: (tempId: string, realData: T) =>
        dispatch({ type: 'CONFIRM_OPTIMISTIC', entity, tempId, realData }),
    }),
    [dispatch, entity]
  );

  return {
    ...entityState,
    actions,
  };
}
