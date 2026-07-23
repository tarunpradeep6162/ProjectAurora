import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

const navigationItems = [
  {
    to: "/story",
    label: "Home",
    end: true,
  },
  {
    to: "/story/our-story",
    label: "Our Story",
  },
  {
    to: "/story/memories",
    label: "Memories",
  },
  {
    to: "/story/journey",
    label: "Our Journey",
  },
  {
    to: "/story/love-letter",
    label: "Love Letter",
  },
  {
    to: "/story/birthday",
    label: "Birthday",
  },
  {
    to: "/story/surprise",
    label: "Surprise",
  },
  {
    to: "/story/quiz",
    label: "Quiz",
  },
  {
    to: "/story/games",
    label: "Games",
  },
];

export default function Navbar() {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [scrolled, setScrolled] =
    useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header
      ref={menuRef}
      className={`birthday-navbar ${
        scrolled
          ? "birthday-navbar--scrolled"
          : ""
      }`}
    >
      <nav
        className="birthday-navbar__inner"
        aria-label="Birthday website navigation"
      >
        <button
          type="button"
          className={`birthday-navbar__menu-button ${
            menuOpen ? "is-open" : ""
          }`}
          onClick={() =>
            setMenuOpen((current) => !current)
          }
          aria-expanded={menuOpen}
          aria-controls="birthday-navigation-links"
          aria-label={
            menuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
        >
          <span />
          <span />
          <span />
        </button>

        <button
          type="button"
          className="birthday-navbar__brand"
          onClick={() => {
            navigate("/story");
            closeMenu();
          }}
          aria-label="Go to birthday home page"
        >
          <span className="birthday-navbar__brand-mark">
            T
          </span>

          <span className="birthday-navbar__brand-text">
            Our Story
          </span>
        </button>

        <div
          id="birthday-navigation-links"
          className={`birthday-navbar__links ${
            menuOpen ? "is-open" : ""
          }`}
        >
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeMenu}
              className={({ isActive }) =>
                `birthday-navbar__link ${
                  isActive
                    ? "is-active"
                    : ""
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <button
          type="button"
          className="birthday-navbar__love-button"
          onClick={() => {
            navigate("/story/surprise");
            closeMenu();
          }}
          aria-label="Open surprise page"
        >
          <span aria-hidden="true">♥</span>
          <span>For You</span>
        </button>
      </nav>
    </header>
  );
}
