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
   * Augment the Palette interface to include a custom 'outerSpace' color.
   * This makes `theme.palette.outerSpace` available with type safety.
   */
  interface Palette {
    outerSpace: PaletteColor;
  }

  /**
   * Augment the PaletteOptions interface to allow defining 'outerSpace'
   * in `createTheme` options.
   */
  interface PaletteOptions {
    outerSpace?: SimplePaletteColorOptions;
  }
}
