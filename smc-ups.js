// smc-ups.js - HMStudio test for smc/ups v1.0.0

(function() {
    console.log('HMStudio All Features script initialized');
  
    // =============== SMART CART FEATURE ===============
    // src/scripts/smartCart.js v1.7.1
(function() {
    console.log('Smart Cart script initialized');
  
    function getStoreIdFromUrl() {
      const scriptTag = document.currentScript;
      const scriptUrl = new URL(scriptTag.src);
      const storeId = scriptUrl.searchParams.get('storeId');
      return storeId ? storeId.split('?')[0] : null;
    }
  
    function getCampaignsFromUrl() {
      const scriptTag = document.currentScript;
      const scriptUrl = new URL(scriptTag.src);
      const campaignsData = scriptUrl.searchParams.get('campaigns');
      
      if (!campaignsData) {
          console.log('No campaigns data found in URL');
          return [];
      }
  
      try {
          const decodedData = atob(campaignsData);
          const parsedData = JSON.parse(decodedData);
          
          return parsedData.map(campaign => ({
              ...campaign,
              timerSettings: {
                  ...campaign.timerSettings,
                  textAr: decodeURIComponent(campaign.timerSettings.textAr || ''),
                  textEn: decodeURIComponent(campaign.timerSettings.textEn || ''),
                  autoRestart: campaign.timerSettings.autoRestart || false
              }
          }));
      } catch (error) {
          console.error('Error parsing campaigns data:', error);
          return [];
      }
    }
  
    function getCurrentLanguage() {
      return document.documentElement.lang || 'ar';
    }
  
    function isMobile() {
      return window.innerWidth <= 768;
    }
  
    const storeId = getStoreIdFromUrl();
    if (!storeId) {
      console.error('Store ID not found in script URL');
      return;
    }
  
    const SmartCart = {
      settings: null,
      campaigns: getCampaignsFromUrl(),
      stickyCartElement: null,
      currentProductId: null,
      activeTimers: new Map(),
      updateInterval: null,
      originalDurations: new Map(),
  
      createStickyCart() {
        if (this.stickyCartElement) {
          this.stickyCartElement.remove();
        }
      
        const container = document.createElement('div');
        container.id = 'hmstudio-sticky-cart';
        container.style.cssText = `
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
          padding: ${isMobile() ? '12px' : '20px'};
          z-index: 999999;
          display: none;
          direction: ${getCurrentLanguage() === 'ar' ? 'rtl' : 'ltr'};
          height: ${isMobile() ? 'auto' : '100px'};  // Added this line
        `;
  
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: ${isMobile() ? '8px' : '15px'};
          flex-wrap: ${isMobile() ? 'wrap' : 'nowrap'};
        `;
  
        // Quantity section container (for mobile layout)
        const quantityContainer = document.createElement('div');
        quantityContainer.style.cssText = `
          display: flex;
          align-items: center;
          gap: 10px;
          width: ${isMobile() ? '100%' : 'auto'};
          background: #f8f8f8;
          border-radius: 8px;
          padding: ${isMobile() ? '8px 12px' : '4px'};
        `;
  
        // Optional: Add quantity label
        const quantityLabel = document.createElement('span');
        quantityLabel.textContent = getCurrentLanguage() === 'ar' ? 'الكمية:' : 'Quantity:';
        quantityLabel.style.cssText = `
          font-size: ${isMobile() ? '14px' : '12px'};
          color: #666;
          ${isMobile() ? 'min-width: 60px;' : ''}
        `;
  
        const quantityWrapper = document.createElement('div');
        quantityWrapper.style.cssText = `
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f5f5f5;
          border-radius: 4px;
          padding: 4px;
          ${isMobile() ? 'flex: 0 0 auto;' : ''}
        `;
        const decreaseBtn = document.createElement('button');
        decreaseBtn.textContent = '-';
        decreaseBtn.style.cssText = `
          width: ${isMobile() ? '40px' : '28px'};
          height: ${isMobile() ? '40px' : '28px'};
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f8f8;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          cursor: pointer;
          font-size: ${isMobile() ? '18px' : '16px'};
          color: #666;
          transition: all 0.2s ease;
          user-select: none;
          flex-shrink: 0;
        `;
      
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.min = '1';
        quantityInput.max = '10';
        quantityInput.value = '1';
        quantityInput.style.cssText = `
          width: ${isMobile() ? '60px' : '40px'};
          height: ${isMobile() ? '40px' : '28px'};
          text-align: center;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          background: white;
          font-size: ${isMobile() ? '16px' : '14px'};
          -moz-appearance: textfield;
          -webkit-appearance: none;
          margin: 0;
          padding: 0;
          ${isMobile() ? 'flex: 0 0 60px;' : ''};
        `;
      
        const increaseBtn = document.createElement('button');
        increaseBtn.textContent = '+';
        increaseBtn.style.cssText = `
          width: ${isMobile() ? '40px' : '28px'};
          height: ${isMobile() ? '40px' : '28px'};
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f8f8;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          cursor: pointer;
          font-size: ${isMobile() ? '18px' : '16px'};
          color: #666;
          transition: all 0.2s ease;
          user-select: none;
          flex-shrink: 0;
        `;
      
        // Add hover effects to buttons
        const addButtonHoverEffects = (button) => {
          button.addEventListener('mouseover', () => {
            button.style.background = '#f0f0f0';
          });
          button.addEventListener('mouseout', () => {
            button.style.background = '#f8f8f8';
          });
          button.addEventListener('mousedown', () => {
            button.style.background = '#e8e8e8';
          });
          button.addEventListener('mouseup', () => {
            button.style.background = '#f0f0f0';
          });
        };
  
        addButtonHoverEffects(decreaseBtn);
        addButtonHoverEffects(increaseBtn);
      
        const updateQuantity = (value) => {
          quantityInput.value = value;
          const originalSelect = document.querySelector('select#product-quantity');
          if (originalSelect) {
            originalSelect.value = value;
            const event = new Event('change', { bubbles: true });
            originalSelect.dispatchEvent(event);
          }
        };
      
        decreaseBtn.addEventListener('click', () => {
          const currentValue = parseInt(quantityInput.value);
          if (currentValue > 1) {
            updateQuantity(currentValue - 1);
          }
        });
      
        increaseBtn.addEventListener('click', () => {
          const currentValue = parseInt(quantityInput.value);
          if (currentValue < 10) {
            updateQuantity(currentValue + 1);
          }
        });
      
        quantityInput.addEventListener('change', (e) => {
          let value = parseInt(e.target.value);
          if (isNaN(value) || value < 1) value = 1;
          if (value > 10) value = 10;
          updateQuantity(value);
        });
  
        // Prevent scrolling when focusing input on mobile
        quantityInput.addEventListener('focus', (e) => {
          e.preventDefault();
          if (isMobile()) {
            quantityInput.blur();
          }
        });
      
        const addButton = document.createElement('button');
        addButton.textContent = getCurrentLanguage() === 'ar' ? 'أضف للسلة' : 'Add to Cart';
        addButton.style.cssText = `
          background-color: var(--theme-primary, #00b286);
          color: white;
          border: none;
          border-radius: 8px;
          height: ${isMobile() ? '48px' : '60px'};
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.3s ease;
          flex: 1;  // Make it stretch in both mobile and desktop
          font-size: ${isMobile() ? '16px' : '16px'};
        `;
  
        addButton.addEventListener('mouseover', () => addButton.style.opacity = '0.9');
        addButton.addEventListener('mouseout', () => addButton.style.opacity = '1');
        addButton.addEventListener('click', () => {
          const originalSelect = document.querySelector('select#product-quantity');
          if (originalSelect) {
            originalSelect.value = quantityInput.value;
            const event = new Event('change', { bubbles: true });
            originalSelect.dispatchEvent(event);
          }
      
          const originalButton = document.querySelector('.btn.btn-add-to-cart');
          if (originalButton) {
            setTimeout(() => {
              originalButton.click();
            }, 100);
          }
        });
  
        // Assemble the quantity section
        quantityWrapper.appendChild(decreaseBtn);
        quantityWrapper.appendChild(quantityInput);
        quantityWrapper.appendChild(increaseBtn);
        quantityContainer.appendChild(quantityLabel);
        quantityContainer.appendChild(quantityWrapper);
      
        // Assemble the final structure
        wrapper.appendChild(quantityContainer);
        wrapper.appendChild(addButton);
        container.appendChild(wrapper);
        document.body.appendChild(container);
      
        this.stickyCartElement = container;
        // Add scroll event listener
        window.addEventListener('scroll', () => {
          const originalButton = document.querySelector('.btn.btn-add-to-cart');
          const originalSelect = document.querySelector('select#product-quantity');
          
          if (!originalButton) return;
      
          const buttonRect = originalButton.getBoundingClientRect();
          const isButtonVisible = buttonRect.top >= 0 && buttonRect.bottom <= window.innerHeight;
          
          if (!isButtonVisible) {
            container.style.display = 'block';
            if (originalSelect) {
              quantityInput.value = originalSelect.value;
            }
          } else {
            container.style.display = 'none';
          }
        });
      },
  
      findActiveCampaignForProduct(productId) {
        const now = new Date();
        const activeCampaign = this.campaigns.find(campaign => {
          if (!campaign.products || !Array.isArray(campaign.products)) {
            return false;
          }
  
          const hasProduct = campaign.products.some(p => p.id === productId);
          
          let endTime;
          try {
            endTime = campaign.endTime?._seconds ? 
              new Date(campaign.endTime._seconds * 1000) :
              new Date(campaign.endTime.seconds * 1000);
          } catch (error) {
            return false;
          }
  
          if (!(endTime instanceof Date && !isNaN(endTime))) {
            return false;
          }
  
          if (hasProduct && !this.originalDurations.has(campaign.id)) {
            const startTime = campaign.startTime?._seconds ? 
              new Date(campaign.startTime._seconds * 1000) :
              new Date(campaign.startTime.seconds * 1000);
            
            const duration = endTime - startTime;
            this.originalDurations.set(campaign.id, duration);
          }
  
          const isNotEnded = now <= endTime || campaign.timerSettings.autoRestart;
          const isActive = campaign.status === 'active';
  
          return hasProduct && isNotEnded && isActive;
        });
  
        return activeCampaign;
      },
  
      createCountdownTimer(campaign, productId) {
        const existingTimer = document.getElementById(`hmstudio-countdown-${productId}`);
        if (existingTimer) {
          existingTimer.remove();
          if (this.activeTimers.has(productId)) {
            clearInterval(this.activeTimers.get(productId));
            this.activeTimers.delete(productId);
          }
        }
  
        const container = document.createElement('div');
        container.id = `hmstudio-countdown-${productId}`;
        container.style.cssText = `
          background: ${campaign.timerSettings.backgroundColor};
          color: ${campaign.timerSettings.textColor};
          padding: ${isMobile() ? '8px 10px' : '12px 15px'};
          margin: ${isMobile() ? '10px 0' : '15px 0'};
          border-radius: 8px;
          text-align: center;
          direction: ${getCurrentLanguage() === 'ar' ? 'rtl' : 'ltr'};
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${isMobile() ? '8px' : '12px'};
          font-size: ${isMobile() ? '12px' : '14px'};
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          flex-wrap: ${isMobile() ? 'wrap' : 'nowrap'};
          width: ${isMobile() ? '100%' : 'auto'};
        `;
  
        const textElement = document.createElement('span');
        const timerText = getCurrentLanguage() === 'ar' ? 
          campaign.timerSettings.textAr : 
          campaign.timerSettings.textEn;
        textElement.textContent = timerText;
        textElement.style.cssText = `
          font-weight: 500;
          ${isMobile() ? 'width: 100%; margin-bottom: 4px;' : ''}
        `;
          
        const timeElement = document.createElement('div');
        timeElement.style.cssText = `
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.15);
          ${isMobile() ? 'width: 100%; justify-content: center;' : ''}
        `;
  
        container.appendChild(textElement);
        container.appendChild(timeElement);
  
        let endTime = campaign.endTime?._seconds ? 
          new Date(campaign.endTime._seconds * 1000) :
          new Date(campaign.endTime.seconds * 1000);
  
        this.activeTimers.set(productId, {
          element: timeElement,
          endTime: endTime,
          campaign: campaign,
          originalDuration: this.originalDurations.get(campaign.id)
        });
  
        return container;
      },
  
      createProductCardTimer(campaign, productId) {
        const existingTimer = document.getElementById(`hmstudio-card-countdown-${productId}`);
        if (existingTimer) {
          return existingTimer;
        }
  
        const container = document.createElement('div');
        container.id = `hmstudio-card-countdown-${productId}`;
        container.style.cssText = `
          background: ${campaign.timerSettings.backgroundColor};
          color: ${campaign.timerSettings.textColor};
          padding: 4px;
          margin-top: 30px !important;
          border-bottom-right-radius: 8px;
          border-bottom-left-radius: 8px;
          text-align: center;
          direction: ${getCurrentLanguage() === 'ar' ? 'rtl' : 'ltr'};
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: ${isMobile() ? '10px' : '12px'};
          width: 100%;
          overflow: hidden;
        `;
  
        const timeElement = document.createElement('div');
        timeElement.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: ${isMobile() ? '2px' : '4px'};
        `;
  
        container.appendChild(timeElement);
  
        let endTime = campaign.endTime?._seconds ? 
          new Date(campaign.endTime._seconds * 1000) :
          new Date(campaign.endTime.seconds * 1000);
  
        const startTime = campaign.startTime?._seconds ? 
          new Date(campaign.startTime._seconds * 1000) :
          new Date(campaign.startTime.seconds * 1000);
  
        const originalDuration = endTime - startTime;
  
        this.activeTimers.set(`card-${productId}`, {
          element: timeElement,
          endTime: endTime,
          campaign: campaign,
          originalDuration: originalDuration,
          isFlashing: false
        });
  
        return container;
      },
  
      // Add keyframes for flashing animation
      addFlashingStyleIfNeeded() {
        if (!document.getElementById('countdown-flash-animation')) {
          const style = document.createElement('style');
          style.id = 'countdown-flash-animation';
          style.textContent = `
            @keyframes countdown-flash {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.3; }
            }
            .countdown-flash {
              animation: countdown-flash 1s ease-in-out infinite;
            }
          `;
          document.head.appendChild(style);
        }
      },
  
      updateAllTimers() {
        this.addFlashingStyleIfNeeded();
        const now = new Date();
        
        this.activeTimers.forEach((timer, id) => {
          if (!timer.element || !timer.endTime) return;
  
          let timeDiff = timer.endTime - now;
  
          // Handle auto-restart
          if (timeDiff <= 0 && timer.campaign?.timerSettings?.autoRestart && timer.originalDuration) {
            const newEndTime = new Date(now.getTime() + timer.originalDuration);
            timer.endTime = newEndTime;
            timeDiff = timer.originalDuration;
            timer.isFlashing = false;
            console.log(`Timer restarted for ${id}, new end time:`, newEndTime);
          } else if (timeDiff <= 0 && !timer.campaign?.timerSettings?.autoRestart) {
            const elementId = id.startsWith('card-') ? 
              `hmstudio-card-countdown-${id.replace('card-', '')}` :
              `hmstudio-countdown-${id}`;
            const element = document.getElementById(elementId);
            if (element) element.remove();
            this.activeTimers.delete(id);
            return;
          }
  
          // Check if we're in the last 5 minutes
          const isLastFiveMinutes = timeDiff <= 300000; // 5 minutes in milliseconds
  
          // Update flashing state if needed
          if (isLastFiveMinutes && !timer.isFlashing) {
            timer.isFlashing = true;
          } else if (!isLastFiveMinutes && timer.isFlashing) {
            timer.isFlashing = false;
          }
  
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
          // Always include all time units
          const timeUnits = [
            {
              value: days,
              label: getCurrentLanguage() === 'ar' ? 'ي' : 'd'
            },
            {
              value: hours,
              label: getCurrentLanguage() === 'ar' ? 'س' : 'h'
            },
            {
              value: minutes,
              label: getCurrentLanguage() === 'ar' ? 'د' : 'm'
            },
            {
              value: seconds,
              label: getCurrentLanguage() === 'ar' ? 'ث' : 's'
            }
          ];
  
          const isCard = id.startsWith('card-');
          const scale = isCard ? (isMobile() ? 0.85 : 1) : 1;
          
          let html = `
            <div class="countdown-units-wrapper ${timer.isFlashing ? 'countdown-flash' : ''}" style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: ${isCard ? '2px' : '4px'};
              transform: scale(${scale});
              flex-wrap: ${isCard ? 'wrap' : 'nowrap'};
              ${isCard ? 'max-width: 100%; padding: 2px;' : ''}
            ">
          `;
  
          timeUnits.forEach((unit, index) => {
            html += `
              <div class="hmstudio-countdown-unit" style="
                display: inline-flex;
                align-items: center;
                white-space: nowrap;
                gap: ${isCard ? '1px' : '2px'};
                ${index < timeUnits.length - 1 ? `margin-${getCurrentLanguage() === 'ar' ? 'left' : 'right'}: ${isCard ? '2px' : '4px'};` : ''}
                ${isCard && index % 2 === 1 ? 'margin-right: 8px;' : ''}
              ">
                <span style="
                  font-weight: bold;
                  min-width: ${isCard ? '14px' : '20px'};
                  text-align: center;
                  font-size: ${isCard ? (isMobile() ? '11px' : '12px') : (isMobile() ? '12px' : '14px')};
                ">${String(unit.value).padStart(2, '0')}</span>
                <span style="
                  font-size: ${isCard ? (isMobile() ? '9px' : '10px') : (isMobile() ? '10px' : '12px')};
                  opacity: 0.8;
                ">${unit.label}</span>
                ${index < timeUnits.length - 1 ? `
                  <span style="
                    margin-${getCurrentLanguage() === 'ar' ? 'right' : 'left'}: ${isCard ? '2px' : '4px'};
                    opacity: 0.8;
                  ">:</span>
                ` : ''}
              </div>
            `;
          });
  
          html += '</div>';
          timer.element.innerHTML = html;
        });
      },
  
      setupProductCardTimers() {
        const productCards = document.querySelectorAll('.product-item');
        const processedCards = new Set();
        
        productCards.forEach(card => {
          let productId = null;
          const wishlistBtn = card.querySelector('[data-wishlist-id]');
          if (wishlistBtn) {
            productId = wishlistBtn.getAttribute('data-wishlist-id');
          }
  
          if (productId && !processedCards.has(productId)) {
            processedCards.add(productId);
            const activeCampaign = this.findActiveCampaignForProduct(productId);
            if (activeCampaign) {
              const timer = this.createProductCardTimer(activeCampaign, productId);
              const imageContainer = card.querySelector('.content');
              if (imageContainer && !document.getElementById(`hmstudio-card-countdown-${productId}`)) {
                imageContainer.parentNode.insertBefore(timer, imageContainer.nextSibling);
              }
            }
          }
        });
      },
  
      setupProductTimer() {
        console.log('Setting up product timer...');
  
        let productId;
        const wishlistBtn = document.querySelector('[data-wishlist-id]');
        if (wishlistBtn) {
          productId = wishlistBtn.getAttribute('data-wishlist-id');
        }
  
        if (!productId) {
          const productForm = document.querySelector('form[data-product-id]');
          if (productForm) {
            productId = productForm.getAttribute('data-product-id');
          }
        }
  
        if (!productId) {
          return;
        }
  
        this.currentProductId = productId;
        const activeCampaign = this.findActiveCampaignForProduct(productId);
  
        if (!activeCampaign) {
          return;
        }
  
        const timer = this.createCountdownTimer(activeCampaign, productId);
  
        const priceSelectors = [
          'h2.product-formatted-price.theme-text-primary',
          '.product-formatted-price',
          '.product-formatted-price.theme-text-primary',
          '.product-price',
          'h2.theme-text-primary',
          '.theme-text-primary'
        ];
  
        let inserted = false;
        for (const selector of priceSelectors) {
          const priceContainer = document.querySelector(selector);
          
          if (priceContainer?.parentElement) {
            priceContainer.parentElement.insertBefore(timer, priceContainer);
            inserted = true;
            break;
          }
        }
  
        if (!inserted) {
          const productDetails = document.querySelector('.products-details');
          if (productDetails) {
            productDetails.insertBefore(timer, productDetails.firstChild);
          }
        }
  
        // Create sticky cart after setting up timer
        this.createStickyCart();
      },
  
      startTimerUpdates() {
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(() => this.updateAllTimers(), 1000);
      },
  
      stopTimerUpdates() {
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
          this.updateInterval = null;
        }
      },
  
      initialize() {
        console.log('Initializing Smart Cart with campaigns:', this.campaigns);
        
        this.stopTimerUpdates();
        
        if (document.querySelector('.product.products-details-page')) {
          console.log('On product page');
          // Create sticky cart regardless of campaigns
          this.createStickyCart();
  
          // Setup timer if there's an active campaign
          const wishlistBtn = document.querySelector('[data-wishlist-id]');
          const productForm = document.querySelector('form[data-product-id]');
          const productId = wishlistBtn?.getAttribute('data-wishlist-id') || 
                         productForm?.getAttribute('data-product-id');
  
          if (productId) {
            const activeCampaign = this.findActiveCampaignForProduct(productId);
            if (activeCampaign) {
              this.setupProductTimer();
              if (this.activeTimers.size > 0) {
                this.startTimerUpdates();
              }
            }
          }
  
          const observer = new MutationObserver((mutations) => {
            // Check if sticky cart needs to be recreated
            if (!document.getElementById('hmstudio-sticky-cart')) {
              this.createStickyCart();
            }
  
            // Check if timer needs to be updated (only if there's an active campaign)
            if (this.currentProductId && !document.getElementById(`hmstudio-countdown-${this.currentProductId}`)) {
              const activeCampaign = this.findActiveCampaignForProduct(this.currentProductId);
              if (activeCampaign) {
                this.setupProductTimer();
                if (this.activeTimers.size > 0 && !this.updateInterval) {
                  this.startTimerUpdates();
                }
              }
            }
          });
  
          observer.observe(document.body, { childList: true, subtree: true });
        } else if (document.querySelector('.product-item')) {
          console.log('On product listing page, setting up card timers');
          this.setupProductCardTimers();
  
          if (this.activeTimers.size > 0) {
            this.startTimerUpdates();
          }
  
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.addedNodes.length) {
                this.setupProductCardTimers();
                if (this.activeTimers.size > 0 && !this.updateInterval) {
                  this.startTimerUpdates();
                }
              }
            });
          });
  
          observer.observe(document.body, { childList: true, subtree: true });
        }
      }
    };
  
    window.addEventListener('beforeunload', () => {
      SmartCart.stopTimerUpdates();
    });
  
    // Handle mobile viewport changes
    window.addEventListener('resize', () => {
      if (SmartCart.stickyCartElement) {
        SmartCart.createStickyCart(); // Recreate sticky cart with updated mobile styles
      }
    });
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => SmartCart.initialize());
    } else {
      SmartCart.initialize();
    }
  })();
  
    // =============== UPSELL FEATURE ===============
    // src/scripts/upsell.js v2.4.7
// HMStudio Upsell Feature

(function() {

    // Add this style block first
    const styleTag = document.createElement('style');
    styleTag.textContent = `
    @font-face {font-family: "Teshrin AR+LT Bold"; src: url("//db.onlinewebfonts.com/t/56364258e3196484d875eec94e6edb93.eot"); 
  src: url("//db.onlinewebfonts.com/t/56364258e3196484d875eec94e6edb93.eot?#iefix") format("embedded-opentype"), url("//db.onlinewebfonts.com/t/56364258e3196484d875eec94e6edb93.woff2") format("woff2"), url("//db.onlinewebfonts.com/t/56364258e3196484d875eec94e6edb93.woff") format("woff"), url("//db.onlinewebfonts.com/t/56364258e3196484d875eec94e6edb93.ttf") format("truetype"), url("//db.onlinewebfonts.com/t/56364258e3196484d875eec94e6edb93.svg#Teshrin AR+LT Bold") format("svg"); 
  }
      /* Base modal styles */
      .hmstudio-upsell-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
    
      .hmstudio-upsell-content {
        background: white;
        padding: 40px;
        border-radius: 12px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        transform: translateY(20px);
        transition: transform 0.3s ease;
      }
    
      /* Responsive sizing based on product count */
      .hmstudio-upsell-content:has(.hmstudio-upsell-products > *:only-child) {
        max-width: 620px; /* For single product */
      }
  
      .hmstudio-upsell-content:has(.hmstudio-upsell-products > *:first-child:nth-last-child(2)) {
        max-width: 750px; /* For two products */
      }
  
      .hmstudio-upsell-content:has(.hmstudio-upsell-products > *:first-child:nth-last-child(3)) {
        max-width: 1000px; /* For three products */
      }
    
      .hmstudio-upsell-header {
        text-align: center;
        margin-bottom: 30px;
      }
    
      .hmstudio-upsell-title {
        font-size: 28px;
        margin-bottom: 10px;
        color: #333;
      }
    
      .hmstudio-upsell-subtitle {
        font-size: 18px;
        color: #666;
        margin: 0;
      }
    
      .hmstudio-upsell-main {
        display: flex;
        gap: 30px;
        align-items: flex-start;
      }
    
      .hmstudio-upsell-sidebar {
        width: 250px;
        flex-shrink: 0;
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        position: sticky;
        top: 20px;
      }
    
      .hmstudio-upsell-products {
        display: grid;
        grid-template-columns: repeat(auto-fit, 180px);
        gap: 20px;
        justify-content: center;
        width: 100%;
        margin: 0 auto;
      }
    
      /* Product Card Styles */
      .hmstudio-upsell-product-card {
        border: 1px solid #eee;
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2) !important;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
    
      /* Product Form Styles */
      .hmstudio-upsell-product-form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    
      .hmstudio-upsell-product-image-container {
        width: 100%;
        margin-bottom: 15px;
      }
    
      .hmstudio-upsell-product-image {
        width: 100%;
        height: 150px;
        object-fit: contain;
        margin-bottom: 10px;
      }
    
      .hmstudio-upsell-product-content {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    
      .hmstudio-upsell-product-title {
        font-size: 16px;
        font-weight: 500;
        color: #333;
        margin: 0;
        min-height: 40px;
        text-align: center;
      }
    
      .hmstudio-upsell-product-price {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--theme-primary, #00b286);
        font-weight: bold;
        justify-content: center;
        margin-bottom: 5px;
      }
    
      /* Variants Styles */
      .hmstudio-upsell-variants {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        margin: 5px 0;
      }
    
      .hmstudio-upsell-variants select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        color: #333;
      }
    
      .hmstudio-upsell-variants label {
        font-size: 14px;
        color: #666;
        margin-bottom: 4px;
      }
    
      /* Product Controls Styles */
      .hmstudio-upsell-product-controls {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 5px;
      }
    
      .hmstudio-upsell-product-quantity {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0;
        margin: 10px auto;
        border: 1px solid #ddd;
        border-radius: 20px;
        padding: 2px;
        width: fit-content;
      }
    
      .hmstudio-upsell-quantity-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #666;
        padding: 0;
      }
    
      .hmstudio-upsell-product-quantity input {
        width: 40px;
        border: none;
        text-align: center;
        font-size: 14px;
        padding: 0;
        -moz-appearance: textfield;
        background: transparent;
      }
    
      .hmstudio-upsell-product-quantity input::-webkit-outer-spin-button,
      .hmstudio-upsell-product-quantity input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    
      /* Add to Cart Button */
      .addToCartBtn {
        width: 100%;
        padding: 8px 15px;
        background: var(--theme-primary, #00b286);
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        transition: opacity 0.3s;
        font-size: 14px;
      }
    
      .addToCartBtn:hover {
        opacity: 0.9;
      }
    
      /* Mobile Styles */
      @media (max-width: 768px) {
        .hmstudio-upsell-content {
          padding: 20px;
          width: 100%;
          height: 100vh;
          border-radius: 0;
          margin: 0;
        }
    
        .hmstudio-upsell-main {
          flex-direction: column;
          gap: 20px;
        }
    
        .hmstudio-upsell-sidebar {
          width: 100%;
          position: static;
          order: 2;
        }
    
        .hmstudio-upsell-products {
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          order: 1;
        }
    
        .hmstudio-upsell-title {
          font-size: 20px;
        }
    
        .hmstudio-upsell-subtitle {
          font-size: 14px;
        }
      }
    
      /* Small Mobile Styles */
      @media (max-width: 480px) {
        .hmstudio-upsell-content {
          padding: 20px;
          width: 100%;
          height: 100vh;
          border-radius: 15px;
          margin: 10px;
        }
    
        .hmstudio-upsell-products {
          flex-direction: column;
          align-items: center !important;
          display: flex !important;
        }
    
        .hmstudio-upsell-product-card {
          width: 100%;
          display: flex;
          padding: 10px;
        }
    
        .hmstudio-upsell-product-form {
          flex-direction: row;
          align-items: center !important;
          width: 100% !important;
          display: flex;
        }
    
        .hmstudio-upsell-product-image-container {
          width: 100px !important;
          height: 100px !important;
          overflow: unset !important;
          margin-bottom: 0;
          margin-right: 15px;
        }
    
        .hmstudio-upsell-product-image {
          height: 100%;
          margin-bottom: 0;
        }
    
        .hmstudio-upsell-product-content {
          flex: 1;
          gap: 8px;
          text-align: left;
        }
    
        .hmstudio-upsell-product-title {
          min-height: auto;
          font-size: 14px !important;
          text-align: start;
          margin-bottom: 0 !important;
        }
    
        .hmstudio-upsell-product-price {
          justify-content: flex-start !important;
          margin-top: 4px;
        }
    
        .hmstudio-upsell-variants {
          margin: 5px 0;
        }
    
        .hmstudio-upsell-variants select {
          padding: 6px;
          font-size: 12px;
        }
    
        .hmstudio-upsell-variants label {
          font-size: 12px;
          text-align: left;
        }
    
        .hmstudio-upsell-product-controls {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 8px;
        }
    
        .hmstudio-upsell-product-quantity {
          margin: 0;
        }
    
        .addToCartBtn {
          flex: 1;
          max-width: 120px;
          padding: 6px 12px;
          font-size: 12px;
        }
      }
    `;
    
    // Add the style tag to the document head
    document.head.appendChild(styleTag);
    
      console.log('Upsell script initialized');
    
      function getStoreIdFromUrl() {
        const scriptTag = document.currentScript;
        const scriptUrl = new URL(scriptTag.src);
        const storeId = scriptUrl.searchParams.get('storeId');
        return storeId ? storeId.split('?')[0] : null;
      }
    
      function getCampaignsFromUrl() {
        const scriptTag = document.currentScript;
        const scriptUrl = new URL(scriptTag.src);
        const campaignsData = scriptUrl.searchParams.get('campaigns');
        
        if (!campaignsData) {
          console.log('No campaigns data found in URL');
          return [];
        }
      
        try {
          const decodedData = atob(campaignsData);
          const parsedData = JSON.parse(decodedData);
          
          return parsedData.map(campaign => ({
            ...campaign,
            textSettings: {
              titleAr: campaign.textSettings?.titleAr || '',
              titleEn: campaign.textSettings?.titleEn || '',
              subtitleAr: campaign.textSettings?.subtitleAr || '',
              subtitleEn: campaign.textSettings?.subtitleEn || ''
            }
          }));
        } catch (error) {
          console.error('Error parsing campaigns data:', error);
          return [];
        }
      }
    
      function getCurrentLanguage() {
        return document.documentElement.lang || 'ar';
      }
    
      const storeId = getStoreIdFromUrl();
      if (!storeId) {
        console.error('Store ID not found in script URL');
        return;
      }
    
      const UpsellManager = {
        campaigns: getCampaignsFromUrl(),
        currentModal: null,
        activeTimeout: null,
    
        async fetchProductData(productId) {
          console.log('Fetching product data for ID:', productId);
          const url = `https://europe-west3-hmstudio-85f42.cloudfunctions.net/getProductData?storeId=${storeId}&productId=${productId}`;
          
          try {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Failed to fetch product data: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Received product data:', data);
            return data;
          } catch (error) {
            console.error('Error fetching product data:', error);
            throw error;
          }
        },
    
        async createProductCard(product, currentCampaign) {
          try {
            const fullProductData = await this.fetchProductData(product.id);
            console.log('Full product data:', fullProductData);
        
            if (!fullProductData) {
              throw new Error('Failed to fetch full product data');
            }
        
            const currentLang = getCurrentLanguage();
            const isRTL = currentLang === 'ar';
        
            let productName = fullProductData.name;
            if (typeof productName === 'object') {
              productName = currentLang === 'ar' ? productName.ar : productName.en;
            }
        
            // Create main card container
            const card = document.createElement('div');
            card.className = 'hmstudio-upsell-product-card';
        
            // Create form
            const form = document.createElement('form');
            form.id = `product-form-${fullProductData.id}`;
            form.className = 'hmstudio-upsell-product-form';
        
            // Product ID input
            const productIdInput = document.createElement('input');
            productIdInput.type = 'hidden';
            productIdInput.id = 'product-id';
            productIdInput.name = 'product_id';
            productIdInput.value = fullProductData.selected_product?.id || fullProductData.id;
            form.appendChild(productIdInput);
        
            // Image container
            const imageContainer = document.createElement('div');
            imageContainer.className = 'hmstudio-upsell-product-image-container';
        
            const productImage = document.createElement('img');
            productImage.className = 'hmstudio-upsell-product-image';
            productImage.src = fullProductData.images?.[0]?.url || product.thumbnail;
            productImage.alt = productName;
            imageContainer.appendChild(productImage);
        
            // Product content container
            const contentContainer = document.createElement('div');
            contentContainer.className = 'hmstudio-upsell-product-content';
        
            // Title
            const title = document.createElement('h5');
            title.className = 'hmstudio-upsell-product-title';
            title.textContent = productName;
            contentContainer.appendChild(title);
        
            // Price container
            const priceContainer = document.createElement('div');
            priceContainer.className = 'hmstudio-upsell-product-price';
        
            const currentPrice = document.createElement('span');
            const oldPrice = document.createElement('span');
            oldPrice.style.textDecoration = 'line-through';
            oldPrice.style.color = '#999';
            oldPrice.style.fontSize = '0.9em';
        
            const currencySymbol = currentLang === 'ar' ? 'ر.س' : 'SAR';
        
            if (fullProductData.formatted_sale_price) {
              const priceValue = fullProductData.formatted_sale_price.replace(' ر.س', '').replace('SAR', '').trim();
              const oldPriceValue = fullProductData.formatted_price.replace(' ر.س', '').replace('SAR', '').trim();
              
              currentPrice.textContent = isRTL ? `${priceValue} ${currencySymbol}` : `${currencySymbol} ${priceValue}`;
              oldPrice.textContent = isRTL ? `${oldPriceValue} ${currencySymbol}` : `${currencySymbol} ${oldPriceValue}`;
              priceContainer.appendChild(currentPrice);
              priceContainer.appendChild(oldPrice);
            } else {
              const priceValue = fullProductData.formatted_price.replace(' ر.س', '').replace('SAR', '').trim();
              currentPrice.textContent = isRTL ? `${priceValue} ${currencySymbol}` : `${currencySymbol} ${priceValue}`;
              priceContainer.appendChild(currentPrice);
            }
            contentContainer.appendChild(priceContainer);
        
            // Add variants if product has options
            if (fullProductData.has_options && fullProductData.variants?.length > 0) {
              const variantsSection = this.createVariantsSection(fullProductData, currentLang);
              variantsSection.className = 'hmstudio-upsell-variants';
              contentContainer.appendChild(variantsSection);
            }
        
            // Controls container
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'hmstudio-upsell-product-controls';
        
            // Quantity selector
            const quantityContainer = document.createElement('div');
            quantityContainer.className = 'hmstudio-upsell-product-quantity';
        
            // Quantity input
            const quantityInput = document.createElement('input');
            quantityInput.type = 'number';
            quantityInput.id = 'product-quantity';
            quantityInput.name = 'quantity';
            quantityInput.min = '1';
            quantityInput.value = '1';
            quantityInput.style.cssText = 'text-align: center; width: 40px; border: none; background: transparent;';
        
            const decreaseBtn = document.createElement('button');
            decreaseBtn.className = 'hmstudio-upsell-quantity-btn';
            decreaseBtn.type = 'button';
            decreaseBtn.textContent = '-';
        
            const increaseBtn = document.createElement('button');
            increaseBtn.className = 'hmstudio-upsell-quantity-btn';
            increaseBtn.type = 'button';
            increaseBtn.textContent = '+';
        
            // Add quantity controls functionality
            decreaseBtn.addEventListener('click', () => {
              const currentValue = parseInt(quantityInput.value);
              if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                const event = new Event('change', { bubbles: true });
                quantityInput.dispatchEvent(event);
              }
            });
        
            increaseBtn.addEventListener('click', () => {
              const currentValue = parseInt(quantityInput.value);
              quantityInput.value = currentValue + 1;
              const event = new Event('change', { bubbles: true });
              quantityInput.dispatchEvent(event);
            });
        
            // Prevent manual typing
            quantityInput.addEventListener('keydown', (e) => {
              e.preventDefault();
            });
        
            quantityContainer.appendChild(decreaseBtn);
            quantityContainer.appendChild(quantityInput);
            quantityContainer.appendChild(increaseBtn);
            controlsContainer.appendChild(quantityContainer);
        
            // Add to cart button
            const addToCartBtn = document.createElement('button');
            addToCartBtn.className = 'addToCartBtn';
            addToCartBtn.type = 'button';
            const originalText = currentLang === 'ar' ? 'إضافة للسلة' : 'Add to Cart';
            const loadingText = currentLang === 'ar' ? 'جاري الإضافة...' : 'Adding...';
            addToCartBtn.textContent = originalText;
  
            // Add to cart functionality
            addToCartBtn.addEventListener('click', () => {
              try {
                // If product has variants, validate all variants are selected
                if (fullProductData.has_options && fullProductData.variants?.length > 0) {
                  const selects = form.querySelectorAll('.variant-select');
                  const missingSelections = [];
                  
                  selects.forEach(select => {
                    const labelText = select.previousElementSibling.textContent;
                    if (!select.value) {
                      missingSelections.push(labelText);
                    }
                  });
  
                  if (missingSelections.length > 0) {
                    const message = currentLang === 'ar' 
                      ? `الرجاء اختيار ${missingSelections.join(', ')}`
                      : `Please select ${missingSelections.join(', ')}`;
                    alert(message);
                    return;
                  }
                }
  
                // Get quantity value
                const quantityValue = parseInt(quantityInput.value);
                if (isNaN(quantityValue) || quantityValue < 1) {
                  const message = currentLang === 'ar' 
                    ? 'الرجاء إدخال كمية صحيحة'
                    : 'Please enter a valid quantity';
                  alert(message);
                  return;
                }
  
                // Show loading state
                addToCartBtn.textContent = loadingText;
                addToCartBtn.disabled = true;
                addToCartBtn.style.opacity = '0.7';
  
                // Use Zid's cart function with formId
                zid.store.cart.addProduct({ 
                  formId: form.id
                })
                .then(function(response) {
                  console.log('Add to cart response:', response);
                  if (response.status === 'success') {
                    if (typeof setCartBadge === 'function') {
                      setCartBadge(response.data.cart.products_count);
                    }
                
                    // Add tracking
                    try {
                      const quantityInput = form.querySelector('#product-quantity');
                      const quantity = parseInt(quantityInput.value) || 1;
                      const productId = form.querySelector('input[name="product_id"]').value;
                      const productName = form.querySelector('.hmstudio-upsell-product-title').textContent;
                      const priceElement = form.querySelector('.hmstudio-upsell-product-price');
                      const priceText = priceElement.textContent.replace(/[^0-9.]/g, '');
                      const price = parseFloat(priceText) || 0;
                
                      fetch('https://europe-west3-hmstudio-85f42.cloudfunctions.net/trackUpsellStats', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          storeId,
                          eventType: 'cart_add',  // Add this line
                          productId,
                          productName,
                          quantity,
                          price,
                          campaignId: currentCampaign.id,
                          campaignName: currentCampaign.name,
                          timestamp: new Date().toISOString()
                        })
                      }).catch(error => {
                        console.error('Failed to track upsell stats:', error);
                      });
                    } catch (error) {
                      console.error('Error tracking upsell stats:', error);
                    }              
                  } else {
                    console.error('Add to cart failed:', response);
                    const errorMessage = currentLang === 'ar' 
                      ? response.data.message || 'فشل إضافة المنتج إلى السلة'
                      : response.data.message || 'Failed to add product to cart';
                    alert(errorMessage);
                  }
                })
                .catch(function(error) {
                  console.error('Add to cart error:', error);
                  const errorMessage = currentLang === 'ar' 
                    ? 'حدث خطأ أثناء إضافة المنتج إلى السلة'
                    : 'Error occurred while adding product to cart';
                  alert(errorMessage);
                })
                .finally(function() {
                  // Reset button state
                  addToCartBtn.textContent = originalText;
                  addToCartBtn.disabled = false;
                  addToCartBtn.style.opacity = '1';
                });
              } catch (error) {
                console.error('Critical error in add to cart:', error);
                // Reset button state on error
                addToCartBtn.textContent = originalText;
                addToCartBtn.disabled = false;
                addToCartBtn.style.opacity = '1';
              }
            });
          
            controlsContainer.appendChild(addToCartBtn);
            contentContainer.appendChild(controlsContainer);
        
            // Assemble the card
            form.appendChild(imageContainer);
            form.appendChild(contentContainer);
            card.appendChild(form);
        
            return card;
          } catch (error) {
            console.error('Error creating product card:', error);
            return null;
          }
        },
    
        createVariantsSection(product, currentLang) {
          const variantsContainer = document.createElement('div');
          variantsContainer.className = 'hmstudio-upsell-variants';
        
          if (product.variants && product.variants.length > 0) {
            const variantAttributes = new Map();
            
            product.variants.forEach(variant => {
              if (variant.attributes && variant.attributes.length > 0) {
                variant.attributes.forEach(attr => {
                  if (!variantAttributes.has(attr.name)) {
                    variantAttributes.set(attr.name, {
                      name: attr.name,
                      slug: attr.slug,
                      values: new Set()
                    });
                  }
                  variantAttributes.get(attr.name).values.add(attr.value[currentLang]);
                });
              }
            });
        
            variantAttributes.forEach(attr => {
              const select = document.createElement('select');
              select.className = 'variant-select';
              select.style.cssText = `
                margin: 5px 0;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                width: 100%;
              `;
        
              const labelText = currentLang === 'ar' ? attr.slug : attr.name;
              
              const label = document.createElement('label');
              label.textContent = labelText;
              label.style.cssText = `
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
              `;
        
              const placeholderText = currentLang === 'ar' ? `اختر ${labelText}` : `Select ${labelText}`;
              let optionsHTML = `<option value="">${placeholderText}</option>`;
              
              Array.from(attr.values).forEach(value => {
                optionsHTML += `<option value="${value}">${value}</option>`;
              });
              
              select.innerHTML = optionsHTML;
        
              select.addEventListener('change', () => {
                this.updateSelectedVariant(product, select.closest('form'));
              });
        
              variantsContainer.appendChild(label);
              variantsContainer.appendChild(select);
            });
          }
        
          return variantsContainer;
        },
    
        updateSelectedVariant(product, form) {
          if (!form) {
            console.error('Product form not found');
            return;
          }
        
          const currentLang = getCurrentLanguage();
          const selectedValues = {};
        
          form.querySelectorAll('.variant-select').forEach(select => {
            if (select.value) {
              const labelText = select.previousElementSibling.textContent;
              selectedValues[labelText] = select.value;
            }
          });
        
          console.log('Selected values:', selectedValues);
        
          const selectedVariant = product.variants.find(variant => {
            return variant.attributes.every(attr => {
              const attrLabel = currentLang === 'ar' ? attr.slug : attr.name;
              return selectedValues[attrLabel] === attr.value[currentLang];
            });
          });
        
          console.log('Found variant:', selectedVariant);
        
          if (selectedVariant) {
            const productIdInput = form.querySelector('input[name="product_id"]');
            if (productIdInput) {
              productIdInput.value = selectedVariant.id;
              console.log('Updated product ID to:', selectedVariant.id);
            }
    
            const priceElement = form.querySelector('.product-price');
            const oldPriceElement = form.querySelector('.product-old-price');
            const currencySymbol = currentLang === 'ar' ? 'ر.س' : 'SAR';
    
            if (priceElement) {
              if (selectedVariant.formatted_sale_price) {
                priceElement.textContent = selectedVariant.formatted_sale_price.replace('SAR', currencySymbol);
                if (oldPriceElement) {
                  oldPriceElement.textContent = selectedVariant.formatted_price.replace('SAR', currencySymbol);
                  oldPriceElement.style.display = 'inline';
                }
              } else {
                priceElement.textContent = selectedVariant.formatted_price.replace('SAR', currencySymbol);
                if (oldPriceElement) {
                  oldPriceElement.style.display = 'none';
                }
              }
            }
    
            const addToCartBtn = form.parentElement.querySelector('.add-to-cart-btn');
            if (addToCartBtn) {
              if (!selectedVariant.unavailable) {
                addToCartBtn.disabled = false;
                addToCartBtn.style.opacity = '1';
                addToCartBtn.style.cursor = 'pointer';
              } else {
                addToCartBtn.disabled = true;
                addToCartBtn.style.opacity = '0.5';
                addToCartBtn.style.cursor = 'not-allowed';
              }
            }
          }
        },
    
        async showUpsellModal(campaign, productCart) {
          console.log('Showing upsell modal:', { campaign, productCart });
          
          if (!campaign?.upsellProducts?.length) {
            console.warn('Invalid campaign data:', campaign);
            return;
          }
          // Track popup open
      try {
        await fetch('https://europe-west3-hmstudio-85f42.cloudfunctions.net/trackUpsellStats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storeId,
            eventType: 'popup_open',
            campaignId: campaign.id,
            campaignName: campaign.name,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Failed to track upsell popup open:', error);
      }
        
          const currentLang = getCurrentLanguage();
          const isRTL = currentLang === 'ar';
        
          try {
            if (this.currentModal) {
              this.currentModal.remove();
            }
        
            // Create main modal container
            const modal = document.createElement('div');
            modal.className = 'hmstudio-upsell-modal';
            if (isRTL) modal.style.direction = 'rtl';
        
            // Create modal content container
            const content = document.createElement('div');
            content.className = 'hmstudio-upsell-content';
        
            // Create close button
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '✕';
            closeButton.style.cssText = `
              position: absolute;
              top: 15px;
              ${isRTL ? 'right' : 'left'}: 15px;
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
              color: #666;
              padding: 5px;
              line-height: 1;
              z-index: 1;
            `;
            closeButton.addEventListener('click', () => this.closeModal());
        
            // Create header section
            const header = document.createElement('div');
            header.className = 'hmstudio-upsell-header';
        
            const title = document.createElement('h2');
            title.className = 'hmstudio-upsell-title';
            title.textContent = currentLang === 'ar' ? 
              decodeURIComponent(campaign.textSettings.titleAr) : 
              campaign.textSettings.titleEn;
        
            const subtitle = document.createElement('p');
            subtitle.className = 'hmstudio-upsell-subtitle';
            subtitle.textContent = currentLang === 'ar' ? 
              decodeURIComponent(campaign.textSettings.subtitleAr) : 
              campaign.textSettings.subtitleEn;
        
            header.appendChild(title);
            header.appendChild(subtitle);
        
            // Create main content wrapper
            const mainWrapper = document.createElement('div');
            mainWrapper.className = 'hmstudio-upsell-main';
        
            // Create sidebar section
            const sidebar = document.createElement('div');
            sidebar.className = 'hmstudio-upsell-sidebar';
        
            // Create benefit text
            const benefitText = document.createElement('div');
            benefitText.style.cssText = `
              text-align: center;
              margin-bottom: 20px;
              font-size: 18px;
              color: #333;
              font-weight: bold;
            `;
            benefitText.textContent = currentLang === 'ar' ? 'استفد من العرض' : 'Benefit from the Offer';
            sidebar.appendChild(benefitText);
        
            // Create Add All to Cart button
            const addAllButton = document.createElement('button');
            addAllButton.textContent = currentLang === 'ar' ? 'أضف الكل إلى السلة' : 'Add All to Cart';
            addAllButton.style.cssText = `
              width: 100%;
              padding: 12px 20px;
              background: #000;
              color: white;
              border: none;
              border-radius: 25px;
              font-size: 16px;
              cursor: pointer;
              transition: background-color 0.3s;
            `;
        
            addAllButton.addEventListener('mouseover', () => {
              addAllButton.style.backgroundColor = '#333';
            });
        
            addAllButton.addEventListener('mouseout', () => {
              addAllButton.style.backgroundColor = '#000';
            });
        
            addAllButton.addEventListener('click', async () => {
              const forms = content.querySelectorAll('form');
              const variantForms = Array.from(forms).filter(form => form.querySelector('.variant-select'));
              
              // Check if all variants are selected
              const allVariantsSelected = variantForms.every(form => {
                const selects = form.querySelectorAll('.variant-select');
                return Array.from(selects).every(select => select.value !== '');
              });
            
              if (!allVariantsSelected) {
                const message = currentLang === 'ar' 
                  ? 'الرجاء اختيار جميع الخيارات المطلوبة قبل الإضافة إلى السلة'
                  : 'Please select all required options before adding to cart';
                alert(message);
                return;
              }
            
              // Add loading state to button
              addAllButton.disabled = true;
              addAllButton.style.opacity = '0.7';
              const originalText = addAllButton.textContent;
              addAllButton.textContent = currentLang === 'ar' ? 'جاري الإضافة...' : 'Adding...';
            
              for (const form of forms) {
                await new Promise((resolve) => {
                  const productId = form.querySelector('input[name="product_id"]').value;
                  const productName = form.querySelector('.hmstudio-upsell-product-title').textContent;
                  const quantityInput = form.querySelector('#product-quantity');
                  const quantity = parseInt(quantityInput.value) || 1;
                  const priceElement = form.querySelector('.hmstudio-upsell-product-price');
                  const priceText = priceElement.textContent.replace(/[^0-9.]/g, '');
                  const price = parseFloat(priceText) || 0;
            
                  zid.store.cart.addProduct({ formId: form.id })
                    .then((response) => {
                      console.log('Add to cart response:', response);
                      if (response.status === 'success') {
                        if (typeof setCartBadge === 'function') {
                          setCartBadge(response.data.cart.products_count);
                        }
            
                        // Track each product addition
                        fetch('https://europe-west3-hmstudio-85f42.cloudfunctions.net/trackUpsellStats', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            storeId,
                            eventType: 'cart_add',  // Add this line
                            productId,
                            productName,
                            quantity,
                            price,
                            campaignId: campaign.id,
                            campaignName: campaign.name,
                            timestamp: new Date().toISOString()
                          })
                        }).catch(error => console.error('Tracking error:', error));
                      }
                      resolve();
                    })
                    .catch((error) => {
                      console.error('Add to cart error:', error);
                      resolve();
                    });
                });
              }
            
              modal.remove();
        
              this.closeModal();
            });
        
            sidebar.appendChild(addAllButton);
        
            // Create products grid
            const productsGrid = document.createElement('div');
            productsGrid.className = 'hmstudio-upsell-products';
        
            // Create and append product cards
            const productCards = await Promise.all(
              campaign.upsellProducts.map(product => this.createProductCard(product, campaign))
            );
        
            productCards.filter(Boolean).forEach(card => {
              card.className = 'hmstudio-upsell-product-card';
              productsGrid.appendChild(card);
            });
        
            // Assemble the modal
            mainWrapper.appendChild(sidebar);
            mainWrapper.appendChild(productsGrid);
        
            content.appendChild(closeButton);
            content.appendChild(header);
            content.appendChild(mainWrapper);
            modal.appendChild(content);
        
            // Add modal to document and animate in
            document.body.appendChild(modal);
            requestAnimationFrame(() => {
              modal.style.opacity = '1';
              content.style.transform = 'translateY(0)';
            });
        
            this.currentModal = modal;
        
            // Add mobile swipe to close functionality
            let touchStartY = 0;
            content.addEventListener('touchstart', (e) => {
              touchStartY = e.touches[0].clientY;
            });
        
            content.addEventListener('touchmove', (e) => {
              const touchY = e.touches[0].clientY;
              const diff = touchY - touchStartY;
              
              if (diff > 0 && content.scrollTop === 0) {
                e.preventDefault();
                content.style.transform = `translateY(${diff}px)`;
              }
            });
        
            content.addEventListener('touchend', (e) => {
              const touchY = e.changedTouches[0].clientY;
              const diff = touchY - touchStartY;
              
              if (diff > 100 && content.scrollTop === 0) {
                this.closeModal();
              } else {
                content.style.transform = 'translateY(0)';
              }
            });
        
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
              if (e.target === modal) this.closeModal();
            });
        
            // Handle escape key
            const handleEscape = (e) => {
              if (e.key === 'Escape') this.closeModal();
            };
            document.addEventListener('keydown', handleEscape);
        
            // Clean up event listener when modal closes
            modal.addEventListener('remove', () => {
              document.removeEventListener('keydown', handleEscape);
            });
        
          } catch (error) {
            console.error('Error creating upsell modal:', error);
          }
        },
    
        closeModal() {
          if (this.currentModal) {
            this.currentModal.style.opacity = '0';
            const content = this.currentModal.querySelector('.hmstudio-upsell-content');
            if (content) {
              content.style.transform = 'translateY(20px)';
            }
            setTimeout(() => {
              if (this.currentModal) {
                this.currentModal.remove();
                this.currentModal = null;
              }
            }, 300);
          }
        },
    
        initialize() {
          console.log('Initializing Upsell');
          
          // Make sure the global object is available
          if (!window.HMStudioUpsell) {
            window.HMStudioUpsell = {
              showUpsellModal: (...args) => {
                console.log('showUpsellModal called with args:', args);
                return this.showUpsellModal.apply(this, args);
              },
              closeModal: () => this.closeModal()
            };
            console.log('Global HMStudioUpsell object created');
          }
    
          // Handle page visibility changes
          document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.currentModal) {
              this.closeModal();
            }
          });
    
          // Handle window resize
          window.addEventListener('resize', () => {
            if (this.currentModal) {
              const content = this.currentModal.querySelector('.hmstudio-upsell-content');
              if (content) {
                content.style.maxHeight = `${window.innerHeight * 0.9}px`;
              }
            }
          });
    
          // Clean up on page unload
          window.addEventListener('beforeunload', () => {
            if (this.currentModal) {
              this.closeModal();
            }
          });
        }
      };
    
      // Initialize when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          UpsellManager.initialize();
        });
      } else {
        UpsellManager.initialize();
      }
    })();
  })();
