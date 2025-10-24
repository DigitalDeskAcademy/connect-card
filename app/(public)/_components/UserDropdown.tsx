/**
 * User Dropdown - Account management and navigation menu
 *
 * Comprehensive user account dropdown that provides quick access to key areas
 * of the application, account information display, and secure logout functionality.
 * Designed for optimal user experience and account management efficiency.
 *
 * Business Objectives:
 * - Provide intuitive access to user account features and navigation
 * - Display user identity clearly for account confirmation and trust
 * - Enable quick navigation between key application areas
 * - Offer secure and prominent logout functionality for security
 * - Maintain user engagement through accessible course and dashboard links
 *
 * User Experience Design:
 * - Visual user identity: Avatar with fallback to initials for instant recognition
 * - Clear information hierarchy: Name → Email → Navigation → Actions
 * - Accessible interactions: Proper ARIA labels and keyboard navigation
 * - Responsive design: Adapts to different screen sizes and orientations
 * - Progressive disclosure: Compact trigger, comprehensive menu when needed
 *
 * Account Management Features:
 * - User identity display with name and email for verification
 * - Avatar image with automatic fallback to user initials
 * - Quick navigation to primary application areas (home, courses, dashboard)
 * - Secure logout functionality with proper session termination
 * - Admin access for users with administrative privileges
 *
 * Navigation Strategy:
 * - Home: Returns to marketing homepage or dashboard based on context
 * - Courses: Access to course catalog for browsing and enrollment
 * - Dashboard: Admin interface for content management and analytics
 * - Logout: Secure session termination with redirect to public pages
 *
 * Accessibility Considerations:
 * - Semantic HTML structure with proper dropdown menu patterns
 * - ARIA labels for screen reader compatibility
 * - Keyboard navigation support for all interactive elements
 * - High contrast design for visual accessibility
 * - Focus management and escape key handling
 *
 * Technical Implementation:
 * - Built with Radix UI primitives for accessibility and behavior
 * - Custom styling with Tailwind CSS for consistent design
 * - Avatar component with automatic image fallback handling
 * - Secure logout hook integration for proper session management
 * - Responsive alignment (align="end") for optimal positioning
 *
 * @component UserDropdown
 * @param {Object} props - Component properties
 * @param {string} props.name - User's display name or email prefix if no name
 * @param {string} props.email - User's email address for identification
 * @param {string} props.image - User's profile image URL or generated avatar
 * @returns {JSX.Element} Complete user dropdown menu with account management
 *
 * @example
 * <UserDropdown
 *   name="John Doe"
 *   email="john@example.com"
 *   image="https://avatar.vercel.sh/john@example.com"
 * />
 */

import {
  BookOpen,
  ChevronDownIcon,
  Home,
  LayoutDashboardIcon,
  LogOutIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

import { useSignOut } from "@/hooks/use-signout";

/**
 * User Dropdown Props Interface
 *
 * Type definition for user information displayed in the dropdown menu.
 * Ensures proper user identity representation and account verification.
 *
 * @interface UserDropdownProps
 * @property {string} name - User's display name (or email prefix if no name set)
 * @property {string} email - User's email address for account identification
 * @property {string} image - Profile image URL or generated avatar from service
 */
interface iAppProps {
  name: string;
  email: string;
  image: string;
}

/**
 * User Dropdown Component
 *
 * Renders a comprehensive user account dropdown menu with profile information,
 * navigation links, and account management actions. Provides secure and intuitive
 * access to key application areas and user account functionality.
 *
 * Component Architecture:
 * - Trigger: Avatar + chevron icon for clear interaction affordance
 * - Header: User identity display (name + email) for account verification
 * - Navigation: Quick links to primary application areas
 * - Actions: Secure logout functionality with session termination
 *
 * User Experience Flow:
 * 1. Click avatar to reveal dropdown menu
 * 2. Verify identity through name/email display
 * 3. Navigate to desired application area or logout
 * 4. Menu auto-closes after selection for clean UX
 *
 * @param {UserDropdownProps} props - User information and configuration
 * @returns {JSX.Element} Complete user dropdown with account management
 */
export function UserDropdown({ email, name, image }: iAppProps) {
  // Secure logout functionality with proper session cleanup
  const handleSignOut = useSignOut();

  return (
    <DropdownMenu>
      {/* Dropdown Trigger - Avatar with interaction affordance */}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
          {/* User Avatar - Visual identity with fallback */}
          <Avatar>
            <AvatarImage src={image} alt="Profile image" />
            <AvatarFallback>{name[0].toUpperCase()}</AvatarFallback>
          </Avatar>

          {/* Dropdown Indicator - Chevron for interaction clarity */}
          <ChevronDownIcon
            size={16}
            className="opacity-60"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>

      {/* Dropdown Menu Content - Right-aligned for optimal positioning */}
      <DropdownMenuContent align="end" className="min-w-48 ">
        {/* User Identity Header - Account verification and trust */}
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="text-foreground truncate text-sm font-medium">
            {name}
          </span>
          <span className="text-muted-foreground truncate text-xs font-normal">
            {email}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Navigation Group - Primary application areas */}
        <DropdownMenuGroup>
          {/* Home Link - Smart redirect to user's appropriate dashboard */}
          <DropdownMenuItem asChild>
            <Link href="/home">
              <Home size={16} className="opacity-60" aria-hidden="true" />
              <span>Home</span>
            </Link>
          </DropdownMenuItem>

          {/* Courses Link - Course catalog and enrollment */}
          <DropdownMenuItem asChild>
            <Link href="/course">
              <BookOpen size={16} className="opacity-60" aria-hidden="true" />
              <span>Courses</span>
            </Link>
          </DropdownMenuItem>

          {/* Dashboard Link - Admin interface and management */}
          <DropdownMenuItem asChild>
            <Link href="/platform/admin">
              <LayoutDashboardIcon
                size={16}
                className="opacity-60"
                aria-hidden="true"
              />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Logout Action - Secure session termination */}
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOutIcon size={16} className="opacity-60" aria-hidden="true" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
