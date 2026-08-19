<?php
/**
 * Shared theme helpers.
 *
 * @package FornaChildTheme
 */

namespace FornaChildTheme;

defined( 'ABSPATH' ) || exit;

/**
 * Return an absolute path inside the child theme.
 *
 * @param string $relative_path Path relative to the child theme root.
 */
function asset_path( string $relative_path ): string {
	return trailingslashit( get_stylesheet_directory() ) . ltrim( $relative_path, '/' );
}

/**
 * Return a public URI inside the child theme.
 *
 * @param string $relative_path Path relative to the child theme root.
 */
function asset_uri( string $relative_path ): string {
	return trailingslashit( get_stylesheet_directory_uri() ) . ltrim( $relative_path, '/' );
}

/**
 * Return the file modification time for cache busting.
 *
 * @param string $relative_path Path relative to the child theme root.
 */
function asset_version( string $relative_path ): ?string {
	$modified_time = filemtime( asset_path( $relative_path ) );

	return false === $modified_time ? null : (string) $modified_time;
}

/**
 * Determine whether the current request renders the main Bricks builder UI.
 */
function is_bricks_builder_main(): bool {
	return function_exists( '\\bricks_is_builder_main' ) && \bricks_is_builder_main();
}
