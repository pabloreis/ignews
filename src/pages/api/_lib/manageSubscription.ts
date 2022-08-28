import { fauna } from '../../../services/fauna';
import { stripe } from '../../../services/stripe';
import { query as q } from 'faunadb';
import { FaunaCollections, FaunaIndexes } from '../../../models/FaunaModel';

interface SaveSubscription {
  subscriptionId: string;
  customerId: string;
  isCreateAction?: boolean;
}

export async function saveSubscription({
  subscriptionId,
  customerId,
  isCreateAction = false,
}: SaveSubscription) {
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

  if (isCreateAction) {
    await fauna.query(
      q.Create(q.Collection(FaunaCollections.Subscriptions), {
        data: subscriptionData,
      })
    );

    return;
  }

  await fauna.query(
    q.Replace(
      q.Select(
        'ref',
        q.Get(q.Match(q.Index(FaunaIndexes.SubscriptionById), subscriptionId))
      ),
      { data: subscriptionData }
    )
  );
}
