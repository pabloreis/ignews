import { fauna } from '../../../services/fauna';
import { stripe } from '../../../services/stripe';
import { query as q } from 'faunadb';
import { FaunaCollections, FaunaIndexes } from '../../../models/FaunaModel';

export async function saveSubscription(
  subscriptionId: string,
  customerId: string
) {
  const userRef = await fauna.query(
    q.Select(
      'ref',
      q.Get(q.Match(q.Index(FaunaIndexes.UserByStripeCustomerId), customerId))
    )
  );

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const subscriptionData = {
    id: subscription.id,
    userId: userRef,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
  };

  await fauna.query(
    q.Create(q.Collection(FaunaCollections.Subscriptions), {
      data: subscriptionData,
    })
  );
}
