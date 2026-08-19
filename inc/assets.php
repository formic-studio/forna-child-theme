<?php
/**
 * Front-end asset loading.
 *
 * @package FornaChildTheme
 */

namespace FornaChildTheme;

defined( 'ABSPATH' ) || exit;

const MAIN_ASSET_HANDLE = 'forna-child-theme';
const MAIN_STYLE_PATH   = 'dist/assets/main.css';
const MAIN_SCRIPT_PATH  = 'dist/assets/main.js';

/**
 * Enqueue built assets when their files exist.
 */
function enqueue_assets(): void {
	if ( is_bricks_builder_main() ) {
		return;
	}

	if ( file_exists( asset_path( MAIN_STYLE_PATH ) ) ) {
		wp_enqueue_style(
			MAIN_ASSET_HANDLE,
			asset_uri( MAIN_STYLE_PATH ),
			array( 'bricks-frontend' ),
			asset_version( MAIN_STYLE_PATH )
		);
	}

	if ( ! file_exists( asset_path( MAIN_SCRIPT_PATH ) ) ) {
		return;
	}

	if ( function_exists( '\\wp_enqueue_script_module' ) ) {
		wp_enqueue_script_module(
			MAIN_ASSET_HANDLE,
			asset_uri( MAIN_SCRIPT_PATH ),
			array(),
			asset_version( MAIN_SCRIPT_PATH )
		);

		return;
	}

	wp_enqueue_script(
		MAIN_ASSET_HANDLE,
		asset_uri( MAIN_SCRIPT_PATH ),
		array(),
		asset_version( MAIN_SCRIPT_PATH ),
		true
	);
}

add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\\enqueue_assets', 20 );

/**
 * Mark the legacy fallback script as an ES module on WordPress below 6.5.
 *
 * @param string $tag    Generated script tag.
 * @param string $handle Registered script handle.
 */
function add_module_type_to_fallback( string $tag, string $handle ): string {
	if ( MAIN_ASSET_HANDLE !== $handle || str_contains( $tag, 'type="module"' ) ) {
		return $tag;
	}

	return str_replace( '<script ', '<script type="module" ', $tag );
}

add_filter( 'script_loader_tag', __NAMESPACE__ . '\\add_module_type_to_fallback', 10, 2 );
