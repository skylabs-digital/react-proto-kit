import React, { useState } from 'react';
import { useUrlStepper, UrlStepper } from '@skylabs-digital/react-proto-kit';

type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirm';

export default function StepperDemo() {
  const [step, helpers] = useUrlStepper<CheckoutStep>(
    'step',
    ['cart', 'shipping', 'payment', 'confirm'],
    'cart'
  );

  const [formData, setFormData] = useState({
    address: '',
    cardNumber: '',
  });

  return (
    <div className="demo-section">
      <h2>🚶 Stepper Demo</h2>
      <div className="card">
        <h3>Features</h3>
        <ul>
          <li>✅ Multi-step wizard/flow</li>
          <li>✅ Next/Previous navigation</li>
          <li>✅ Direct step access via goTo</li>
          <li>✅ isFirst/isLast helpers</li>
          <li>✅ Browser back navigates steps</li>
        </ul>
      </div>

      <div className="stepper-header">
        <div className={`step ${step === 'cart' ? 'active' : ''}`}>
          1. Shopping Cart
        </div>
        <div className={`step ${step === 'shipping' ? 'active' : ''}`}>
          2. Shipping
        </div>
        <div className={`step ${step === 'payment' ? 'active' : ''}`}>
          3. Payment
        </div>
        <div className={`step ${step === 'confirm' ? 'active' : ''}`}>
          4. Confirmation
        </div>
      </div>

      <div className="step-content">
        <UrlStepper
          param="step"
          value="cart"
          steps={['cart', 'shipping', 'payment', 'confirm']}
          defaultStep="cart"
        >
          <h3>🛒 Shopping Cart</h3>
          <p>Review your items before checkout.</p>
          <ul>
            <li>Product A - $29.99</li>
            <li>Product B - $49.99</li>
            <li>Product C - $19.99</li>
          </ul>
          <p>
            <strong>Total: $99.97</strong>
          </p>
        </UrlStepper>

        <UrlStepper
          param="step"
          value="shipping"
          steps={['cart', 'shipping', 'payment', 'confirm']}
          defaultStep="cart"
        >
          <h3>📦 Shipping Information</h3>
          <div className="filter-group">
            <label>Shipping Address:</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St, City, State 12345"
            />
          </div>
          <p>
            <small>Estimated delivery: 3-5 business days</small>
          </p>
        </UrlStepper>

        <UrlStepper
          param="step"
          value="payment"
          steps={['cart', 'shipping', 'payment', 'confirm']}
          defaultStep="cart"
        >
          <h3>💳 Payment Method</h3>
          <div className="filter-group">
            <label>Card Number:</label>
            <input
              type="text"
              value={formData.cardNumber}
              onChange={e => setFormData({ ...formData, cardNumber: e.target.value })}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
          </div>
          <p>
            <small>🔒 Your payment information is secure</small>
          </p>
        </UrlStepper>

        <UrlStepper
          param="step"
          value="confirm"
          steps={['cart', 'shipping', 'payment', 'confirm']}
          defaultStep="cart"
        >
          <h3>✅ Order Confirmation</h3>
          <p>Please review your order before placing it.</p>
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '6px' }}>
            <p>
              <strong>Items:</strong> 3 products
            </p>
            <p>
              <strong>Total:</strong> $99.97
            </p>
            <p>
              <strong>Shipping to:</strong> {formData.address || 'Not provided'}
            </p>
            <p>
              <strong>Payment:</strong> **** **** ****{' '}
              {formData.cardNumber.slice(-4) || 'Not provided'}
            </p>
          </div>
        </UrlStepper>
      </div>

      <div className="stepper-footer">
        <button className="secondary" onClick={helpers.prev} disabled={helpers.isFirst}>
          ← Previous
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="outline" onClick={helpers.reset}>
            Reset
          </button>
          {helpers.isLast ? (
            <button className="primary" onClick={() => alert('Order placed! 🎉')}>
              Place Order
            </button>
          ) : (
            <button className="primary" onClick={helpers.next}>
              Next →
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
        <strong>Step Info:</strong> {helpers.currentIndex + 1} / {helpers.totalSteps} |{' '}
        {helpers.isFirst && 'First step'} {helpers.isLast && 'Last step'}
      </div>
    </div>
  );
}
