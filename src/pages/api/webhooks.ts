import { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'stream';
import Stripe from 'stripe';

import { StripeEvents } from '../../models/StripeModels';
import { stripe } from '../../services/stripe';
import { saveSubscription } from './_lib/manageSubscription';

const buffer = async (readable: Readable) => {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
};

export const config = {
  api: {
    bodyParser: false,
  },
};

const relevantEvents = new Set(Object.values(StripeEvents));

export default async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method === 'POST') {
    const buf = await buffer(request);
    const secret = request.headers['stripe-signature'];

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        buf,
        secret,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      return response.status(400).send(`Webhook error: ${error.message}`);
    }

    const { type } = event;

    if (relevantEvents.has(type as StripeEvents)) {
      const customerSubscriptionEvent = async () => {
        const subscription = event.data.object as Stripe.Subscription;

        await saveSubscription({
          subscriptionId: subscription.id,
          customerId: subscription.customer.toString(),
        });
      };
      const stripeEventsModel = {
        [StripeEvents.CustomerSubscriptionUpdated]: customerSubscriptionEvent,
        [StripeEvents.CustomerSubscriptionDeleted]: customerSubscriptionEvent,
        [StripeEvents.CheckSessionCompleted]: async () => {
          const checkoutSession = event.data.object as Stripe.Checkout.Session;

          await saveSubscription({
            subscriptionId: checkoutSession.subscription.toString(),
            customerId: checkoutSession.customer.toString(),
            isCreateAction: true,
          });
        },
        error: () => {
          throw new Error('Unhandled event');
        },
      };

      try {
        stripeEventsModel[type]?.() || stripeEventsModel.error();
      } catch {
        return response.json({ error: 'Webhook handler failed.' });
      }
    }

    response.json({ received: true });
  } else {
    response.setHeader('Allow', 'POST');
    response.status(405).end('Method not allowed');
  }
};
