import React, { FC, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import logoWhite from "../assets/logo-white.png";
import { LanguageSelector } from "../language";
import { default as ProfilePicture } from "./ProfilePicture";

type NavBarProps = {
  lastname: string;
  firstname: string;
  sciper: number;
  role: string;
};

const NavBar: FC<NavBarProps> = ({ lastname, firstname, sciper, role }) => {
  const { t } = useTranslation();

  // used for the profile button
  const [profileToggle, setProfileToggle] = useState(false);
  const triggerProfileToggle = () => {
    setProfileToggle(!profileToggle);
  };

  // used for the mobile menu button
  const [menuToggle, setMenuToggle] = useState(false);
  const triggerMenuToggle = () => {
    setMenuToggle(!menuToggle);
  };

  return (
    <nav className="bg-gray-800 w-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Mobile icon */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              onClick={triggerMenuToggle}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${menuToggle ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>

              <svg
                className={`${menuToggle ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center sm:justify-start">
            <div className="flex-shrink-0 flex items-center">
              <NavLink to="/">
                <img
                  className="block lg:hidden h-6 w-auto"
                  src={logoWhite}
                  alt="Workflow"
                />
                <img
                  className="hidden lg:block h-6 w-auto"
                  src={logoWhite}
                  alt="Workflow"
                />
              </NavLink>
            </div>
            <div className="hidden sm:block sm:ml-6">
              <div className="flex space-x-4">
                {(role === "admin" || role === "operator") && (
                  <NavLink
                    title={t("navBarCreate")}
                    to="/create-election"
                    className={(isActive) =>
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    }
                  >
                    {t("navBarCreate")}
                  </NavLink>
                )}

                {(role === "admin" || role === "operator") && (
                  <NavLink
                    to="/elections"
                    title={t("navBarCreate")}
                    className={(isActive) =>
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    }
                  >
                    {t("navBarStatus")}
                  </NavLink>
                )}

                {role === "admin" && (
                  <NavLink
                    to="/admin"
                    className={(isActive) =>
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    }
                  >
                    Admin
                  </NavLink>
                )}

                <NavLink
                  to="/vote"
                  className={(isActive) =>
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  }
                >
                  {t("navBarVote")}
                </NavLink>

                <NavLink
                  to="/results"
                  className={(isActive) =>
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  }
                >
                  {t("navBarResult")}
                </NavLink>

                <NavLink
                  to="/about"
                  className={(isActive) =>
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  }
                >
                  {t("navBarAbout")}
                </NavLink>

                {sciper !== 0 ? (
                  <li>
                    Logged as {firstname} {lastname}
                    <br />
                    <a href="/api/logout">Logout</a>
                  </li>
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <LanguageSelector />

            <button
              type="button"
              className="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            >
              <span className="sr-only">View notifications</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>

            <div className="ml-3 relative">
              <div>
                <button
                  onClick={triggerProfileToggle}
                  type="button"
                  className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  id="user-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  <ProfilePicture />
                </button>
              </div>

              <div
                className={`${
                  profileToggle
                    ? "ease-out duration-100 transform opacity-100 scale-100"
                    : "ease-in duration-75 transform opacity-0 scale-95"
                } transition origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none`}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
                tabIndex={-1}
              >
                {
                  <div>
                    <a
                      href="#top"
                      className="block px-4 py-2 text-sm text-gray-700"
                      role="menuitem"
                      tabIndex={-1}
                      id="user-menu-item-0"
                    >
                      Your Profile
                    </a>
                    <a
                      href="#top"
                      className="block px-4 py-2 text-sm text-gray-700"
                      role="menuitem"
                      tabIndex={-1}
                      id="user-menu-item-1"
                    >
                      Settings
                    </a>
                    <a
                      href="#top"
                      className="block px-4 py-2 text-sm text-gray-700"
                      role="menuitem"
                      tabIndex={-1}
                      id="user-menu-item-2"
                    >
                      Sign out
                    </a>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="sm:hidden"
        style={menuToggle ? {} : { display: "none" }}
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          <NavLink
            to="/create-election"
            title={t("navBarCreate")}
            className={(isActive) =>
              isActive
                ? "bg-gray-900 text-white px-3 py-2"
                : "text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            }
          >
            {t("navBarCreate")}
          </NavLink>

          <NavLink
            to="/elections"
            title={t("navBarCreate")}
            className={(isActive) =>
              isActive
                ? "bg-gray-900 text-white px-3 py-2"
                : "text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            }
          >
            {t("navBarStatus")}
          </NavLink>

          <NavLink
            to="/vote"
            className={(isActive) =>
              isActive
                ? "bg-gray-900 text-white px-3 py-2"
                : "text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            }
          >
            {t("navBarVote")}
          </NavLink>

          <NavLink
            to="/results"
            className={(isActive) =>
              isActive
                ? "bg-gray-900 text-white px-3 py-2"
                : "text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            }
          >
            {t("navBarResult")}
          </NavLink>

          <NavLink
            to="/about"
            className={(isActive) =>
              isActive
                ? "bg-gray-900 text-white px-3 py-2"
                : "text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            }
          >
            {t("navBarAbout")}
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
