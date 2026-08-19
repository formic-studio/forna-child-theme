<?php
/**
 * Theme features and internationalization.
 *
 * @package FornaChildTheme
 */

namespace FornaChildTheme;

defined( 'ABSPATH' ) || exit;

/**
 * Register child-theme and WooCommerce support.
 */
function setup(): void {
	load_child_theme_textdomain(
		'forna-child-theme',
		get_stylesheet_directory() . '/languages'
	);

	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'woocommerce' );
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );
}

add_action( 'after_setup_theme', __NAMESPACE__ . '\\setup' );
