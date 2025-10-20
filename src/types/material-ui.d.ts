import '@mui/material/styles';

declare module '@mui/material/styles' {
  /**
   * Extend the PaletteColor interface to include a 950 shade,
   * allowing custom palettes (and potentially default ones like grey) to use it.
   */
  interface PaletteColor {
    950?: string;
  }

  /**
   * Extend SimplePaletteColorOptions to allow defining a 950 shade
   * when creating or augmenting a palette.
   */
  interface SimplePaletteColorOptions {
    950?: string;
  }

  /**
   * Augment the Palette interface to include custom color palettes.
   * This makes `theme.palette.outerSpace`, `theme.palette.denim`, and `theme.palette.congressBlue` available with type safety.
   */
  interface Palette {
    outerSpace: PaletteColor;
    denim: PaletteColor;
    congressBlue: PaletteColor;
  }

  /**
   * Augment the PaletteOptions interface to allow defining custom palettes
   * in `createTheme` options.
   */
  interface PaletteOptions {
    outerSpace?: SimplePaletteColorOptions;
    denim?: SimplePaletteColorOptions;
    congressBlue?: SimplePaletteColorOptions;
  }
}
