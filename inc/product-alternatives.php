<?php
/**
 * Product-size alternatives displayed on Regla product pages.
 *
 * @package FornaChildTheme
 */

namespace FornaChildTheme;

defined( 'ABSPATH' ) || exit;

const REGLA_PRODUCT_SLUGS = array( 'regla-s', 'regla-m', 'regla-l' );

/**
 * Render the two other Regla sizes in a stable, predictable order.
 */
function render_regla_product_alternatives(): void {
	global $product;

	if ( ! $product instanceof \WC_Product || ! in_array( $product->get_slug(), REGLA_PRODUCT_SLUGS, true ) ) {
		return;
	}

	$alternatives = array();

	foreach ( REGLA_PRODUCT_SLUGS as $slug ) {
		if ( $slug === $product->get_slug() ) {
			continue;
		}

		$post = get_page_by_path( $slug, OBJECT, 'product' );

		if ( ! $post instanceof \WP_Post ) {
			continue;
		}

		$alternative = wc_get_product( $post->ID );

		if ( $alternative instanceof \WC_Product && $alternative->is_visible() ) {
			$alternatives[] = $alternative;
		}
	}

	if ( array() === $alternatives ) {
		return;
	}

	echo '<div class="forna-product__alternatives forna-product__upsells">';
	echo '<ul class="products columns-2">';

	foreach ( $alternatives as $alternative ) {
		$link  = $alternative->get_permalink();
		$title = $alternative->get_name();
		$price = $alternative->get_price_html();

		echo '<li class="product forna-product-size-card">';
		echo '<a class="woocommerce-LoopProduct-link woocommerce-loop-product__link" href="' . esc_url( $link ) . '">';
		echo wp_kses_post( $alternative->get_image( 'woocommerce_thumbnail', array( 'loading' => 'lazy' ) ) );
		echo '<h2 class="woocommerce-loop-product__title">' . esc_html( $title ) . '</h2>';
		echo '<span class="price">' . wp_kses_post( $price ) . '</span>';
		echo '</a>';
		echo '</li>';
	}

	echo '</ul>';
	echo '</div>';
}

add_action( 'forna_product_alternatives', __NAMESPACE__ . '\\render_regla_product_alternatives' );
