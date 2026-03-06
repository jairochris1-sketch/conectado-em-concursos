import { useState, useEffect } from "react";
import { UserFollow } from "@/entities/all";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sendAppNotification } from "@/functions/sendAppNotification";

export default function FollowButton({ targetEmail, targetId, targetName, targetPhotoUrl, size = "sm", variant = "outline" }) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => User.me(),
    staleTime: Infinity,
  });

  const { data: userFollowings = [], isPending } = useQuery({
    queryKey: ['userFollowings', user?.email],
    queryFn: () => UserFollow.filter({ follower_email: user.email }),
    enabled: !!user?.email,
    staleTime: 1000 * 60 * 5,
  });

  const followRecord = userFollowings.find(f => f.following_email === targetEmail);
  const isFollowing = !!followRecord;
  const followId = followRecord?.id;

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    setIsLoading(true);

    try {
      if (isFollowing) {
        await UserFollow.delete(followId);
        toast.success(`Você deixou de seguir ${targetName}`);
      } else {
        await UserFollow.create({
          follower_email: user.email,
          following_email: targetEmail,
          following_name: targetName,
          following_photo_url: targetPhotoUrl
        });
        toast.success(`Você agora está seguindo ${targetName}`);

        await sendAppNotification({
          targetEmail: targetEmail,
          title: "Novo seguidor",
          message: `${user.full_name} começou a seguir você`,
          type: "follow",
          actionUrl: createPageUrl("UserProfile") + "?id=" + encodeURIComponent(user.id),
          relatedUserName: user.full_name,
          relatedUserPhoto: user.profile_photo_url
        });
      }
      queryClient.invalidateQueries({ queryKey: ['userFollowings', user.email] });
    } catch (error) {
      toast.error("Erro ao processar ação");
    }
    setIsLoading(false);
  };

  if (!user || user.email === targetEmail) return null;

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleFollow}
      disabled={isLoading}
      className={
        isFollowing 
          ? "bg-gray-700 hover:bg-gray-600 text-white border-gray-600" 
          : "bg-white hover:bg-gray-100 text-gray-900 border-gray-300 shadow-sm"
      }
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-1" />
          Seguindo
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1" />
          Seguir
        </>
      )}
    </Button>
  );
}