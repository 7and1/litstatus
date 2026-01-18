// Core Components
export { ErrorBoundary, useErrorHandler } from "./ErrorBoundary";
export { AsyncErrorBoundary, useAsyncError } from "./AsyncErrorBoundary";

// UI Components
export { Skeleton, SkeletonText, SkeletonButton, SkeletonCard, SkeletonList } from "./Skeleton";
export { ToastContainer, useToast } from "./Toast";
export type { ToastType, Toast } from "./Toast";
export { Modal, useModal } from "./Modal";
export { FocusTrap, useFocusTrap } from "./FocusTrap";
export { LazyImage, ProgressiveImage } from "./LazyImage";
export { OnlineStatus, useOnlineStatus } from "./OnlineStatus";

// Loading States
export {
  LoadingWrapper,
  WithLoading,
  withLoading,
  TextSkeleton,
  CardSkeleton,
  ListSkeleton,
  LoadingSpinner,
  PageTransition,
} from "./LoadingWrapper";

// Optimistic UI
export {
  useOptimisticMutation,
  useOptimisticForm,
  useOfflineQueue,
} from "./OptimisticUI";

// Accessibility
export {
  VisuallyHidden,
  LiveRegion,
  useFocusManager,
  useAnnouncer,
  WithAria,
  SkipLinks,
  Heading,
  Landmark,
  LoadingIndicator,
} from "./Accessibility";

// Shell Components
export { default as MarketingShell } from "./MarketingShell";
export { default as HomeClient } from "./HomeClient";
export { default as LoginClient } from "./LoginClient";
export { default as LanguageSwitcher } from "./LanguageSwitcher";
export { LangProvider } from "./LangProvider";

// Client Provider
export { ClientProvider } from "./ClientProvider";
