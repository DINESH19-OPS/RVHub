"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/auth-client";
import { Star, Loader2, ArrowLeft, Calendar, User as UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

const LiquidChrome = dynamic(() => import("@/components/LiquidChrome"), { ssr: false });

interface Item {
  id: number;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  averageRating: number;
  totalReviews: number;
}

interface Review {
  id: number;
  itemId: number;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [item, setItem] = useState<Item | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchItemAndReviews();
    }
  }, [params.id]);

  const fetchItemAndReviews = async () => {
    try {
      const [itemRes, reviewsRes] = await Promise.all([
        fetch(`/api/items?id=${params.id}`),
        fetch(`/api/reviews?itemId=${params.id}&limit=50`)
      ]);

      if (itemRes.ok) {
        const itemData = await itemRes.json();
        setItem(itemData);
      }

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId: parseInt(params.id as string),
          userId: session.user.id,
          rating,
          title,
          comment,
        }),
      });

      if (response.ok) {
        // Reset form
        setTitle("");
        setComment("");
        setRating(5);
        setShowReviewForm(false);
        
        // Refresh data
        await fetchItemAndReviews();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to submit review");
      }
    } catch (error) {
      setError("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 transition-all ${
              interactive ? "cursor-pointer hover:scale-110" : ""
            } ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-muted-foreground"
            }`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Item not found</h1>
          <Button asChild>
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-6xl px-4 py-8 relative">
        {/* LiquidChrome Background */}
        <div className="fixed inset-0 opacity-20 pointer-events-none" style={{ height: '100vh' }}>
          <LiquidChrome
            baseColor={[0.15, 0.1, 0.2]}
            speed={1}
            amplitude={0.6}
            interactive={true}
          />
        </div>

        <div className="relative z-10">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to all items
            </Link>
          </Button>

          {/* Item Details */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              <Image
                src={
                  item.name.toLowerCase().includes("iphone 15")
                    ? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_zJnvLwcXGHYA6yui-qBOft8dtGWlD8MYvQ&s"
                    : item.name.toLowerCase().includes("tokyo disney")
                    ? "https://girleatworld.net/wp-content/uploads/2019/05/tokyo-disneyland-08.jpg"
                    : item.imageUrl ||
                      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
                }
                alt={item.name}
                fill
                unoptimized
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.src = "/images/iphone-15-pro.svg";
                }}
                className="object-cover"
              />
            </div>

            <div className="space-y-6">
              <div>
                <Badge className="mb-3">{item.category}</Badge>
                <h1 className="text-4xl font-bold mb-4">{item.name}</h1>
                <p className="text-muted-foreground text-lg">{item.description}</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="text-6xl font-bold text-primary">{item.averageRating.toFixed(1)}</div>
                  <div>
                    {renderStars(item.averageRating)}
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.totalReviews} {item.totalReviews === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                </div>

                {session?.user ? (
                  !showReviewForm ? (
                    <Button
                      onClick={() => setShowReviewForm(true)}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Write a Review
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowReviewForm(false)}
                      className="w-full"
                    >
                      Cancel Review
                    </Button>
                  )
                ) : (
                  <Button asChild className="w-full bg-primary hover:bg-primary/90">
                    <Link href="/login">Sign in to write a review</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Review Form */}
          {showReviewForm && session?.user && (
            <Card className="mb-12 border-primary/50">
              <CardHeader>
                <CardTitle>Write Your Review</CardTitle>
                <CardDescription>Share your experience with {item.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReview} className="space-y-6">
                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Your Rating</Label>
                    {renderStars(rating, true, setRating)}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Review Title</Label>
                    <Input
                      id="title"
                      placeholder="Sum up your experience"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comment">Your Review (Optional)</Label>
                    <Textarea
                      id="comment"
                      placeholder="Tell us more about your experience..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={5}
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          <div>
            <h2 className="text-3xl font-bold mb-6">
              Reviews ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  No reviews yet. Be the first to review {item.name}!
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <Card key={review.id} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{review.title}</h3>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(review.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {renderStars(review.rating)}
                      </div>
                      {review.comment && (
                        <p className="text-muted-foreground leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4 mt-20 relative z-10">
        <div className="container mx-auto max-w-7xl text-center text-muted-foreground">
          <p>&copy; 2024 ReviewHub. Rate anything from A to Z.</p>
        </div>
      </footer>
    </div>
  );
}